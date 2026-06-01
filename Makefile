.PHONY: up down build logs clean restart health

up:
	docker-compose up -d

build:
	docker-compose up --build -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

restart:
	docker-compose restart

health:
	@echo "Checking service health..."
	@curl -sf http://localhost:8880/actuator/health && echo "Gateway: OK" || echo "Gateway: FAIL"
	@curl -sf http://localhost:8880/api/v1/auth/health && echo "Auth: OK" || echo "Auth: FAIL"
	@curl -sf http://localhost:3001 && echo "Frontend: OK" || echo "Frontend: FAIL"

ps:
	docker-compose ps
