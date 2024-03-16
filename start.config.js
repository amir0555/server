module.exports = {
    apps: [
        {
            name:"server",
            script: "./server.js",
            instances: "1",
            exec_mode: "cluster",
            max_memory_restart: '4G'
        },
        {
            script: "./socket.js",
            name:"Socket",
            instances: "1",
            exec_mode: "cluster",
            max_memory_restart: '1G'
        },
   
    ]
}