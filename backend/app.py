from connexion import FlaskApp
from connexion.middleware import MiddlewarePosition
from starlette.middleware.cors import CORSMiddleware
import os
SWAGGER_PATH=os.environ["SWAGGER_PATH"]
app = FlaskApp(__name__, specification_dir='.')
app.add_api(SWAGGER_PATH)

app.add_middleware(
    CORSMiddleware,
    position=MiddlewarePosition.BEFORE_EXCEPTION,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
