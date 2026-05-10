from fastapi import FastAPI
import uvicorn

app = FastAPI()


def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True


@app.get("/")
async def hello():
    return {"message": "Hello from python!"}


@app.get("/compute")
async def compute():
    count = sum(1 for n in range(2, 50001) if is_prime(n))
    return {"primes_up_to_50000": count}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
