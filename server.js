import polka from 'polka';
import stoppable from 'stoppable';

const PORT = process.env.PORT || 8001;

const app = polka();
const server = stoppable(app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is listening on port ${PORT}`);
}));

let isShuttingDown = false;

const shutdown = () => {
    if (isShuttingDown) {
        console.error('Shutdown already in progress, ignoring additional signal');
        return;
    }

    isShuttingDown = true;
    console.log('Received shutdown signal, closing server gracefully...');

    server.stop((err) => {
        if (err) {
            console.error('Error during server shutdown:', err);
        }
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
