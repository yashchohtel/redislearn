import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Rate limiter middleware
const rateLimiter = async (req, res, next) => {

    try {

        const key = `rate-limit:${req.ip}`;
        const requests = await redis.incr(key);

        if (requests === 1) {
            await redis.expire(key, 60);
        }

        if (requests > 5) {
            return res.status(429).json({
                message: "Too many requests. Try again after 1 minute."
            });
        }

        next();
    } catch (error) {

        res.status(500).json({ message: error.message });

    }
    
};

export default rateLimiter;