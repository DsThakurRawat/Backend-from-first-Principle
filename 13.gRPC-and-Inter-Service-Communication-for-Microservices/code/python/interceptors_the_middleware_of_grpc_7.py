import grpc

class AuthInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        md = dict(handler_call_details.invocation_metadata)
        token = md.get("authorization", "")
        if not valid(token):
            # short-circuit: abort before the handler ever runs
            def deny(request, context):
                context.abort(grpc.StatusCode.UNAUTHENTICATED, "missing or invalid token")
            return grpc.unary_unary_rpc_method_handler(deny)
        return continuation(handler_call_details)  # proceed to next / handler

# Register interceptors when building the server (applied in order):
server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=10),
    interceptors=[AuthInterceptor()],
)

# Client-side interceptors also exist (e.g. to inject auth on every call):
#   channel = grpc.intercept_channel(base_channel, MyClientInterceptor())
