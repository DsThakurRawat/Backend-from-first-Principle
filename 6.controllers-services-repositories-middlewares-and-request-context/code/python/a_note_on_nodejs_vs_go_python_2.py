def list_books_handler():
    sort = request.args.get("sort")  # None if absent

    # VALIDATION: if present, must be an allowed value.
    if sort is not None and sort not in ("name", "date"):
        return jsonify({"error": "sort must be 'name' or 'date'"}), 400

    # TRANSFORMATION: optional param -> inject a default.
    if sort is None:
        sort = "date"

    try:
        books = book_service.list_books(sort)  # delegate
    except Exception:
        return jsonify({"error": "could not fetch books"}), 500

    return jsonify(books), 200  # array of books
