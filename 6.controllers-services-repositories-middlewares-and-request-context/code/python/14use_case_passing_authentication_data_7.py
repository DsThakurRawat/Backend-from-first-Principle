def create_book_handler(request):
    req = CreateBookRequest(**request.get_json())

    # Read the trusted user id FROM THE CONTEXT, not from the body.
    # The auth middleware put it there after verifying the token.
    user_id = request.context["user_id"]
    role = request.context["role"]

    if role not in ("admin", "user"):
        return Response("forbidden", status=403)

    # Persist with the SERVER-VERIFIED owner id — never the client's.
    book = book_service.create(req, user_id)
    return jsonify(book), 201
