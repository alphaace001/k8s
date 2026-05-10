FROM rust:latest

WORKDIR /app

COPY . .

RUN cargo build --release

EXPOSE 8081

CMD ["./target/release/hello-world"]
