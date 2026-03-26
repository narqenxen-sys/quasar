import { io } from "socket.io-client";

// Create a single socket instance to be used throughout the app
// This prevents multiple connections and socket ID changes during navigation
const socket = io();

export default socket;
