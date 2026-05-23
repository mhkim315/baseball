from slowapi import Limiter
from starlette.requests import Request


def get_real_ip(request: Request) -> str:
    """Get real client IP behind Cloudflare/Nginx proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can be a comma-separated list; leftmost is the original client
        return forwarded.split(",")[0].strip()
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=get_real_ip, default_limits=["100/minute"])
