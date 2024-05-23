// Import the functions you need from the SDKs you need
const initializeApp = require("firebase/app");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("firebase/database");
const {v4: uuidv4} = require("uuid");
require("dotenv").config();

// config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
initializeApp(firebaseConfig);

admin.initializeApp();

const db = admin.database();

/**
 * Leer todos los pacientes
 * @param {Object} req - El objeto de solicitud HTTP.
 * @param {Object} res - El objeto de respuesta HTTP.
 * @returns {void}
 */
exports.getAllPatients = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.ref("pacientes").once("value");
    const patients = snapshot.val();
    await logAccess("GET", "/pacientes");
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

/**
 * Obtiene los datos de un paciente en particular.
 * @param {Object} req - El objeto de solicitud HTTP.
 * @param {Object} res - El objeto de respuesta HTTP.
 * @returns {void}
 */
exports.getPatientById = functions.https.onRequest(async (req, res) => {
  const patientId = req.params[0];
  try {
    const snapshot = await db.ref(`pacientes/${patientId}`).once("value");
    const patient = snapshot.val();
    if (patient) {
      if (patient.accesible === false) {
        res.status(403).send("Access to this patient is restricted");
      } else {
        await logAccess("GET", `/pacientes/${patientId}`);
        res.status(200).json(patient);
      }
    } else {
      res.status(404).send("Patient not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


/**
 * Crear un nuevo registro en el nodo de pacientes
 * @param {Object} req - El objeto de solicitud HTTP.
 * @param {Object} res - El objeto de respuesta HTTP.
 * @returns {void}
 */
exports.createPatient = functions.https.onRequest(async (req, res) => {
  const {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    numeroSeguridadSocial,
    accesible,
  } = req.body;
  const patientId = uuidv4();
  const newPatient = {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    numeroSeguridadSocial,
    accesible,
  };

  try {
    await db.ref(`pacientes/${patientId}`).set(newPatient);
    await logAccess("POST", "/pacientes");
    res.status(201).json({id: patientId, ...newPatient});
  } catch (error) {
    res.status(500).send(error.message);
  }
});


/**
 * Crear un nuevo registro en el nodo de pacientes
 * @param {Object} method - El objeto de solicitud HTTP.
 * @param {Object} endpoint - El objeto de respuesta HTTP.
 * @return {void}
 */
async function logAccess(method, endpoint) {
  const logEntry = {
    createdAt: Date.now(),
    message: `Acceso a endpoint ${method} ${endpoint}`,
  };
  await db.ref("logs").push(logEntry);
}
