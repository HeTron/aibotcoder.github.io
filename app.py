from flask import Flask, render_template, json
from flask_frozen import Freezer

app = Flask(__name__)
freezer = Freezer(app)

# Load JSON content
with open("projects.json") as f:
    projects = json.load(f)

with open("blog.json") as f:
    blog_posts = json.load(f)

# Home page
@app.route("/")
def home():
    return render_template("home.html")

# Portfolio page
@app.route("/portfolio.html")
def portfolio():
    return render_template("index.html", projects=projects)

# About page
@app.route("/about.html")
def about():
    return render_template("about.html")

# Contact page
@app.route("/contact.html")
def contact():
    return render_template("contact.html")

# Blog listing page
@app.route("/blog-posts.html")
def blog():
    return render_template("blog.html", posts=blog_posts)

# Individual blog post page
@app.route("/blog/<slug>")
def blog_post(slug):
    post = next((p for p in blog_posts if p["slug"] == slug), None)
    if post is None:
        return "<h2>Post not found</h2>", 404
    return render_template("blog_post.html", post=post)

# Register blog URLs for freezing
@freezer.register_generator
def blog_post():
    for post in blog_posts:
        yield {'slug': post['slug']}

if __name__ == "__main__":
    app.run(debug=True)

