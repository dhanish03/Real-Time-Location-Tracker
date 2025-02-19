const socket = io();

// Get User Name on Connect
const userName = prompt("Enter your name");

// Send location updates
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, speed } = position.coords;
            socket.emit("send-location", { latitude, longitude, speed, userName });
        },
        (error) => {
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Get Battery Status
if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
        socket.emit("send-battery", battery.level * 100);
        battery.addEventListener("levelchange", () => {
            socket.emit("send-battery", battery.level * 100);
        });
    });
}

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Dhanish Abdul"
}).addTo(map);

const markers = {};
const paths = {};

socket.on("receive-location", (data) => {
    const { id, latitude, longitude, speed, time, userName } = data;

    // Update Map View
    map.setView([latitude, longitude]);

    // Add Marker or Update Existing Marker
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
        markers[id].getPopup().setContent(
            `<strong>${userName || "User"}</strong><br>
            Speed: ${speed ? speed.toFixed(2) + " m/s" : "N/A"}<br>
            Time: ${time}<br>
            Battery: ${markers[id].batteryLevel || "N/A"}%`
        );
    } else {
        markers[id] = L.marker([latitude, longitude])
            .bindPopup(
                `<strong>${userName || "User"}</strong><br>
                Speed: ${speed ? speed.toFixed(2) + " m/s" : "N/A"}<br>
                Time: ${time}<br>
                Battery: N/A`
            )
            .addTo(map)
            .openPopup();

        paths[id] = L.polyline([[latitude, longitude]], { color: 'blue' }).addTo(map);
    }

    // Update Path
    paths[id].addLatLng([latitude, longitude]);
});

socket.on("receive-battery", (data) => {
    const { id, battery } = data;
    if (markers[id]) {
        markers[id].batteryLevel = battery;
        markers[id].getPopup().setContent(
            markers[id].getPopup().getContent().replace(/Battery:.*%/, `Battery: ${battery}%`)
        );
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    if (paths[id]) {
        map.removeLayer(paths[id]);
        delete paths[id];
    }
});

socket.on("user-count", (count) => {
    document.getElementById("userCount").innerText = `Active Users: ${count}`;
});
