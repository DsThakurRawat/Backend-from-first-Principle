// Build tag keeps slow integration tests out of the fast unit run:
//   //go:build integration      → run with:  go test -tags=integration ./...
func TestUserRepo_SaveAndFind(t *testing.T) {
    ctx := context.Background()

    // Arrange: start a REAL Postgres in a throwaway container (testcontainers-go)
    pg, err := postgres.Run(ctx, "postgres:16",
        postgres.WithDatabase("app"), postgres.WithUsername("u"), postgres.WithPassword("p"))
    if err != nil { t.Fatal(err) }
    t.Cleanup(func() { pg.Terminate(ctx) }) // torn down automatically after the test

    dsn, _ := pg.ConnectionString(ctx, "sslmode=disable")
    db, _ := sql.Open("postgres", dsn)
    runMigrations(t, db)                    // apply the same schema as production

    repo := NewUserRepo(db)

    // Act: exercise the REAL query path
    _ = repo.Save(User{ID: "u1", Email: "a@x.com"})
    got, err := repo.FindByID("u1")

    // Assert: round-trips correctly through actual SQL
    if err != nil || got.Email != "a@x.com" {
        t.Fatalf("round-trip failed: %v / %+v", err, got)
    }
}
