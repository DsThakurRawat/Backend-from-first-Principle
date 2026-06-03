# BAD — N+1 queries (Django ORM)
posts = Post.objects.all()
for post in posts:
    print(post.author.name)  # Each access fires a separate query!

# GOOD — 1 query with JOIN (ForeignKey)
posts = Post.objects.select_related("author").all()

# GOOD — 2 queries (ManyToMany or reverse FK)
posts = Post.objects.prefetch_related("tags").all()
