import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

# 1. Inicializar Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("🚀 Iniciando carga de datos iniciales en Firestore...")

# ---------------------------------------------------------
# 2. Datos de Proyectos
# ---------------------------------------------------------
proyectos_iniciales = {
    "lisboa_residencial": {
        "nombre": "Lisboa Residencial",
        "descripcion": "Desarrollo residencial en preventa",
        "activo": True,
        "meta_ad_ids": ["444444444", "120205849302"],
        "creado_en": datetime.now(timezone.utc)
    }
}

for doc_id, data in proyectos_iniciales.items():
    db.collection("proyectos").document(doc_id).set(data)
    print(f"✅ Proyecto creado: {data['nombre']}")

# ---------------------------------------------------------
# 3. Datos de Asesoras (Ejemplo con 2 asesoras para el turno)
# ---------------------------------------------------------
asesoras_iniciales = {
    "asesora_laura_01": {
        "nombre": "Laura Mendoza",
        "telefono": "5214491234567",
        "email": "laura.mendoza@grupoaba.mx",
        "proyectos_asignados": ["lisboa_residencial"],
        "esta_activa": True,
        "leads_totales": 0,
        "ultimo_lead_asignado": datetime.now(timezone.utc)
    },
    "asesora_sofia_02": {
        "nombre": "Sofía Castro",
        "telefono": "5214497654321",
        "email": "sofia.castro@grupoaba.mx",
        "proyectos_asignados": ["lisboa_residencial"],
        "esta_activa": True,
        "leads_totales": 0,
        "ultimo_lead_asignado": datetime.now(timezone.utc)
    }
}

for doc_id, data in asesoras_iniciales.items():
    db.collection("asesoras").document(doc_id).set(data)
    print(f"✅ Asesora creada: {data['nombre']}")

print("\n🎉 ¡Estructura y datos cargados exitosamente en Firestore!")