import "database/sql"

db, err := sql.Open("postgres", connStr)
if err != nil {
    log.Fatal(err)
}

// Configure the built-in connection pool
db.SetMaxOpenConns(25)                  // max open connections to the DB
db.SetMaxIdleConns(10)                  // max idle connections kept ready
db.SetConnMaxLifetime(5 * time.Minute)  // recycle connections after 5 min
db.SetConnMaxIdleTime(1 * time.Minute)  // close idle connections after 1 min
