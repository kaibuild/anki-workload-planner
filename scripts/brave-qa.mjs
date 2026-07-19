import { access, mkdtemp, rm, stat } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import process from 'node:process'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceApp = resolve(process.env.BRAVE_QA_SOURCE_APP_PATH ?? '/Applications/Brave Browser.app')
const sourceExecutable = join(sourceApp, 'Contents/MacOS/Brave Browser')
const qaRoot = await mkdtemp(join(tmpdir(), 'anki-workload-planner-brave-qa-'))
const copiedApp = join(qaRoot, 'Brave Browser QA.app')
const copiedExecutable = join(copiedApp, 'Contents/MacOS/Brave Browser')
const port = Number(process.env.BRAVE_QA_PORT) || await reservePort()
const baseUrl = `http://127.0.0.1:${port}`
let preview

try {
  if (process.platform !== 'darwin') {
    throw new Error('qa:brave currently supports macOS only. It will never substitute another browser.')
  }

  await assertReadableApp(sourceApp, sourceExecutable)
  await run('ditto', ['--noqtn', sourceApp, copiedApp], {
    cwd: projectRoot,
    label: 'temporary Brave copy',
  })
  await assertCopiedApp(copiedExecutable, qaRoot)

  preview = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: projectRoot,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    },
  )
  preview.stdout.on('data', (chunk) => process.stdout.write(`[preview] ${chunk}`))
  preview.stderr.on('data', (chunk) => process.stderr.write(`[preview] ${chunk}`))

  await waitForPreview(baseUrl, preview)
  await run(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'test:e2e'],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        QA_BASE_URL: baseUrl,
        BRAVE_QA_EXECUTABLE_PATH: copiedExecutable,
        BRAVE_QA_COPY_ROOT: qaRoot,
        BRAVE_QA_SOURCE_APP_PATH: sourceApp,
      },
      label: 'copied-Brave E2E suite',
    },
  )
} finally {
  await stopChild(preview)
  await removeQaRoot(qaRoot)
}

async function assertReadableApp(appPath, executablePath) {
  const appInfo = await stat(appPath).catch(() => null)
  if (!appInfo?.isDirectory()) {
    throw new Error(`Brave app was not found at ${appPath}. The normal app will not be launched.`)
  }
  await access(executablePath).catch(() => {
    throw new Error(`Brave executable was not found inside ${appPath}. The normal app will not be launched.`)
  })
}

async function assertCopiedApp(executablePath, copyRoot) {
  const normalizedRoot = `${resolve(copyRoot)}/`
  const normalizedExecutable = resolve(executablePath)
  if (!normalizedExecutable.startsWith(normalizedRoot)) {
    throw new Error('Copied Brave executable escaped the temporary QA directory.')
  }
  const info = await stat(normalizedExecutable).catch(() => null)
  if (!info?.isFile()) throw new Error('The temporary Brave copy is incomplete.')
  await access(join(copyRoot, 'Brave Browser QA.app/Contents/Resources')).catch(() => {
    throw new Error('The complete Brave application bundle was not copied.')
  })
}

async function reservePort() {
  const server = createServer()
  return await new Promise((resolvePort, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not reserve a local preview port.')))
        return
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

async function waitForPreview(url, child) {
  const deadline = Date.now() + 30_000
  let lastError
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Production preview exited early with code ${child.exitCode}.`)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
      lastError = new Error(`Preview returned HTTP ${response.status}.`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150))
  }
  throw new Error(`Production preview did not become ready: ${String(lastError)}`)
}

async function run(command, args, { cwd, env = process.env, label }) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit', detached: false })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun()
      else reject(new Error(`${label} failed (${signal ? `signal ${signal}` : `exit ${code}`}).`))
    })
  })
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return
  signalChildGroup(child, 'SIGTERM')
  const exited = await Promise.race([
    new Promise((resolveExit) => child.once('exit', () => resolveExit(true))),
    new Promise((resolveTimeout) => setTimeout(() => resolveTimeout(false), 3_000)),
  ])
  if (!exited && child.exitCode === null) {
    signalChildGroup(child, 'SIGKILL')
    await new Promise((resolveExit) => child.once('exit', resolveExit))
  }
}

function signalChildGroup(child, signal) {
  try {
    process.kill(-child.pid, signal)
  } catch {
    if (child.exitCode === null) child.kill(signal)
  }
}

async function removeQaRoot(path) {
  const normalized = resolve(path)
  const expectedPrefix = `${resolve(tmpdir())}/anki-workload-planner-brave-qa-`
  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(`Refusing to remove unexpected QA path: ${normalized}`)
  }
  await rm(normalized, { recursive: true, force: true })
}
