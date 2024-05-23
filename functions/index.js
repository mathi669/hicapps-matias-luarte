// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import functions from "firebase-functions";
import {getDatabase, ref, get, set, push} from "firebase/database";
import {v4 as uuidv4} from "uuid";
import dotenv from "dotenv";

dotenv.config();


// config
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app);
const db = getDatabase(app);

/**
 * Leer todos los pacientes
 * @param {Object} req - objeto de solicitud HTTP.
 * @param {Object} res - objeto de respuesta HTTP.
 * @returns {void}
 */
export const getAllPatients = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await get(ref(db, "pacientes"));
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
export const getPatientById = functions.https.onRequest(async (req, res) => {
  const patientId = req.params[0];
  try {
    const snapshot = await get(ref(db, `pacientes/${patientId}`));
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
export const createPatient = functions.https.onRequest(async (req, res) => {
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
    await set(ref(db, `pacientes/${patientId}`), newPatient);
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
  await push(ref(db, "logs"), logEntry);
}
