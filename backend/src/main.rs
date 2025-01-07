#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
mod cors;

#[get("/get_text")]
fn get_text() -> &'static str {
    "JOE"
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![get_text])
        .attach(cors::CORS)
}
