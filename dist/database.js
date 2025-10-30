import mongoose from 'mongoose';
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Обработка событий подключения
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
        });
        // Обработка событий отключения (для корректного завершения работы)
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed through app termination');
            process.exit(0);
        });
        return conn;
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
export default connectDB;
//# sourceMappingURL=database.js.map