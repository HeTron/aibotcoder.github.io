from flask_frozen import Freezer
import shutil
import os

from app import app

app.config['FREEZER_DESTINATION'] = 'build'
freezer = Freezer(app)

if __name__ == "__main__":
    freezer.freeze()

    if os.path.exists("cname.txt"):
        shutil.copy("cname.txt", "build/CNAME")
        print("CNAME file copied.")
    else:
        print("cname.txt not found. Skipping CNAME generation.")
