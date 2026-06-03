docker compose up -d        # build (if needed) + start everything in the background
docker compose ps           # status of all services
docker compose logs -f api  # tail one service's logs
docker compose down         # stop & remove containers + network (volumes kept)
docker compose down -v      # ...and delete the volumes too (fresh DB)
