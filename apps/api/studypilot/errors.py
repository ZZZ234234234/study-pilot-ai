class AppError(Exception):
    def __init__(self, message: str, code: str = "invalid_request", status: int = 400):
        self.message = message
        self.code = code
        self.status = status
        super().__init__(message)
