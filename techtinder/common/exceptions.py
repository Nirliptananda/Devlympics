from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, dict):
        if "detail" in data and not data.get("errors"):
            return Response({"detail": data["detail"]}, status=response.status_code)

        errors = {k: v for k, v in data.items() if k != "detail"}
        if errors:
            return Response({"detail": "Please correct the errors below.", "errors": errors}, status=response.status_code)

        if "detail" in data:
            return Response({"detail": data["detail"]}, status=response.status_code)

    if isinstance(data, list):
        return Response({"detail": data[0] if data else "Request failed."}, status=response.status_code)

    return response
