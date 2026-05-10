use actix_web::{get,post,web,App,HttpResponse, HttpServer, Responder}; 

fn is_prime(n: u64) -> bool {
    if n < 2 { return false; }
    if n < 4 { return true; }
    if n % 2 == 0 || n % 3 == 0 { return false; }
    let mut i = 5;
    while i * i <= n {
        if n % i == 0 || n % (i + 2) == 0 { return false; }
        i += 6;
    }
    true
}

#[get("/")]
async fn hello() -> impl Responder{
    HttpResponse::Ok().body("Hello World!")
}

#[get("/compute")]
async fn compute() -> impl Responder {
    let count = web::block(|| {
        (2..=50_000u64).filter(|&n| is_prime(n)).count()
    }).await.unwrap();
    HttpResponse::Ok().json(serde_json::json!({ "primes_up_to_50000": count }))
}

#[post("/echo")]
async fn echo(req_body:String)->impl Responder{
    HttpResponse::Ok().body(req_body)
}


async fn manual_hello() -> impl Responder{
    HttpResponse::Ok().body("Heey there")
}

// #[get("/index.html")]
async fn index() -> impl Responder{
    "Hello World!"
}


#[actix_web::main]
async fn main() -> std::io::Result<()>{
    HttpServer::new(|| {
        App::new()
        .service(hello)
        .service(compute)
        .service(echo)
        .route("/hey", web::get().to(manual_hello))
        .service(
            web::scope("/app")
            .route("/index.html", web::get().to(index)),
        )
        // .service(
        //     web::scope("/app")
        //     .service(index)
        // )
    })
    .bind(("0.0.0.0",8081))?
    .run()
    .await 
}