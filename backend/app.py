from connexion import FlaskApp
from connexion.middleware import MiddlewarePosition
from starlette.middleware.cors import CORSMiddleware
import os

SWAGGER_PATH = os.environ["SWAGGER_PATH"]
app = FlaskApp(__name__, specification_dir='.')

# Add static file serving for projects directory
app.app.static_folder = 'projects'
app.app.static_url_path = '/projects'

# 🔧 Add a unique name to avoid blueprint conflict
app.add_api(SWAGGER_PATH, name="main_api")

# Add CORS middleware
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
