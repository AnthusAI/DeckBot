const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from a given port
 * @param {number} startPort - Port to start searching from (default: 5555)
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(startPort = 5555) {
  let port = startPort;

  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      console.log(`Found available port: ${port}`);
      return port;
    }
    port++;
  }

  throw new Error(`No available ports found in range ${startPort}-${startPort + 99}`);
}

module.exports = { findAvailablePort, isPortAvailable };
