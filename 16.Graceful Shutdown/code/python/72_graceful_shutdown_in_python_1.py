import asyncio
import signal
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("app")

SHUTDOWN_TIMEOUT = 30  # hard limit in seconds


class Application:
    def __init__(self):
        self._shutdown = asyncio.Event()

    async def startup(self):
        # Acquire resources IN ORDER
        self.redis = await connect_redis()       # 1
        self.db = await connect_database()      # 2
        self.server = await start_http_server()  # 3
        log.info("server started, ready to accept requests")

    def install_signal_handlers(self):
        # Handle SIGINT (Ctrl+C, dev) and SIGTERM (PM2/k8s, prod)
        # the SAME way — both mean "shut down gracefully".
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._on_signal, sig)

    def _on_signal(self, sig):
        # NOTE: SIGKILL can never reach here — it cannot be
        # caught or ignored. Only the polite signals arrive.
        log.info(f"signal received: {sig.name} — shutting down")
        self._shutdown.set()

    async def graceful_shutdown(self):
        # 1. CONNECTION DRAINING: stop accepting new requests,
        #    let in-flight requests finish within the timeout.
        log.info("draining HTTP connections...")
        self.server.stop_accepting_new()
        try:
            await asyncio.wait_for(
                self.server.wait_for_inflight(),
                timeout=SHUTDOWN_TIMEOUT,
            )
        except asyncio.TimeoutError:
            log.warning("timeout exceeded — forcing shutdown")

        # 2 & 3. Release resources in REVERSE order of acquisition.
        #    Acquired redis -> db -> server; release server -> db -> redis.
        log.info("committing/rolling back open transactions...")
        await self.db.close()     # commit or rollback, then close pool
        log.info("closing redis connection...")
        await self.redis.close()
        log.info("server exited properly")


async def main():
    app = Application()
    await app.startup()
    app.install_signal_handlers()
    await app._shutdown.wait()   # the "living" phase — block until signal
    await app.graceful_shutdown()


if __name__ == "__main__":
    asyncio.run(main())
