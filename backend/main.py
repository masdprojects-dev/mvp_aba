import os
import uvicorn
import json
import requests
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import firebase_admin
from firebase_admin import credentials, firestore

WHATSAPP_TOKEN = "EAAga3M5CqkcBSRF7GsRGwA3swRPS285halHhQOlVtDLexXt6ZC8BS4UhM4HdlQtjHhXRvT9bxnWHs90adYPUxKt3wAMAKsoHU3XFzb4IXrX52XjK7tYnYb5A7LqWVpe53glIkIWBTzPRdWEfZAlzst8ZBnJKTP4zLGchAnTARcKxyI4aceYOeXIHchaGJ6zBgZDZD"
WHATSAPP_PHONE_ID = "1265246653343968"
VERIFY_TOKEN = "aba_crm_secreto_2026"

db = None
try:
    if not firebase_admin._apps:
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    db = firestore.client()
    print("🔥 Conectado a Firebase Firestore exitosamente.")
except Exception as e:
    print(f"❌ ERROR CRÍTICO DE FIREBASE: {e}")

app = FastAPI(title="ABA CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WebLeadRequest(BaseModel):
    nombre: str
    telefono: str
    email: str = ""
    mensaje: str = ""
    proyecto_id: str = "lisboa_residencial"
    origen_utm: str = "landing_web_formulario"

def formatear_telefono(telefono: str) -> str:
    limpio = "".join(filter(str.isdigit, str(telefono)))
    if len(limpio) == 10:
        return f"521{limpio}"
    if len(limpio) == 12 and limpio.startswith("52"):
        return f"521{limpio[2:]}"
    return limpio

def _enviar_payload_whatsapp(payload: dict):
    if not WHATSAPP_TOKEN:
        print("⚠️ WhatsApp Token no configurado.")
        return

    url = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"📡 Respuesta Meta ({payload.get('to')}): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Error de conexión con Meta API: {e}")

def enviar_bienvenida_cliente(telefono_cliente: str, nombre_cliente: str, asesora_nombre: str, asesora_telefono: str, proyecto_nombre: str = "Lisboa Residencial"):
    telefono_dest = formatear_telefono(telefono_cliente)
    telefono_asesora_link = formatear_telefono(asesora_telefono)

    texto = (
        f"¡Hola {nombre_cliente}! 👋 Gracias por tu interés en *{proyecto_nombre}*.\n\n"
        f"Te he asignado con nuestra asesora comercial *{asesora_nombre}*, quien te brindará atención personalizada.\n\n"
        f"📲 Puedes escribirle directo a su WhatsApp aquí:\n"
        f"https://wa.me/{telefono_asesora_link}\n\n"
        f"En un momento ella también se pondrá en contacto contigo."
    )

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": telefono_dest,
        "type": "text",
        "text": {"preview_url": True, "body": texto}
    }
    _enviar_payload_whatsapp(payload)

def enviar_alerta_asesora(asesora_telefono: str, asesora_nombre: str, nombre_cliente: str, telefono_cliente: str, proyecto_nombre: str, primer_mensaje: str = ""):
    telefono_dest = formatear_telefono(asesora_telefono)
    telefono_cliente_link = formatear_telefono(telefono_cliente)

    texto = (
        f"🔔 *¡NUEVO LEAD ASIGNADO!* 🔔\n\n"
        f"Hola *{asesora_nombre}*, se te ha asignado un nuevo prospecto:\n\n"
        f"👤 *Cliente:* {nombre_cliente}\n"
        f"📞 *Teléfono:* +{telefono_cliente_link}\n"
        f"🏡 *Proyecto:* {proyecto_nombre}\n"
        f"💬 *Mensaje:* \"{primer_mensaje}\"\n\n"
        f"👉 Toca aquí para abrir el chat del cliente:\n"
        f"https://wa.me/{telefono_cliente_link}"
    )

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": telefono_dest,
        "type": "text",
        "text": {"preview_url": True, "body": texto}
    }
    _enviar_payload_whatsapp(payload)

def obtener_siguiente_asesora(proyecto_id: str):
    if not db:
        return None
    try:
        asesoras_ref = db.collection("asesoras")
        query = (
            asesoras_ref
            .where("esta_activa", "==", True)
            .where("proyectos_asignados", "array_contains", proyecto_id)
            .order_by("ultimo_lead_asignado", direction=firestore.Query.ASCENDING)
            .limit(1)
        )
        docs = list(query.stream())
        
        if not docs:
            fallback_query = (
                asesoras_ref
                .where("esta_activa", "==", True)
                .order_by("ultimo_lead_asignado", direction=firestore.Query.ASCENDING)
                .limit(1)
            )
            docs = list(fallback_query.stream())
            
        if docs:
            doc = docs[0]
            asesora_data = doc.to_dict()
            asesora_data["id"] = doc.id
            return asesora_data
    except Exception as e:
        print(f"⚠️ Error al consultar asesora en turno: {e}")
    return None

def registrar_asignacion_asesora(asesora_id: str):
    if not db or not asesora_id:
        return
    try:
        asesora_ref = db.collection("asesoras").document(asesora_id)
        asesora_ref.update({
            "ultimo_lead_asignado": firestore.SERVER_TIMESTAMP,
            "leads_totales": firestore.Increment(1)
        })
    except Exception as e:
        print(f"⚠️ Error actualizando métricas de la asesora: {e}")

@app.get("/")
def root():
    return {"status": "ok", "service": "ABA CRM Webhook API"}

@app.get("/api/meta/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        print("✅ Webhook verificado por Meta exitosamente.")
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificación inválido")

@app.post("/api/meta/webhook")
async def receive_event(request: Request):
    try:
        payload = await request.json()
        obj_type = payload.get("object")

        if obj_type == "whatsapp_business_account":
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    if change.get("field") == "messages":
                        val = change.get("value", {})
                        messages = val.get("messages", [])
                        contacts = val.get("contacts", [])

                        for msg in messages:
                            if "text" not in msg and "button" not in msg and "interactive" not in msg:
                                continue

                            sender_phone = msg.get("from")
                            sender_name = contacts[0].get("profile", {}).get("name", "Cliente") if contacts else "Cliente"
                            
                            if "text" in msg:
                                primer_texto = msg.get("text", {}).get("body", "")
                            elif "button" in msg:
                                primer_texto = msg.get("button", {}).get("text", "")
                            else:
                                primer_texto = "[Mensaje Multimedia o Interactivo]"

                            proyecto_id = "lisboa_residencial"
                            doc_id = f"wa_{sender_phone}"

                            if db and sender_phone:
                                lead_doc_ref = db.collection("leads").document(doc_id)
                                lead_snapshot = lead_doc_ref.get()

                                # =========================================
                                # CASO 1: CLIENTE RECURRENTE (YA EXISTE)
                                # =========================================
                                if lead_snapshot.exists:
                                    lead_existente = lead_snapshot.to_dict()
                                    asignacion = lead_existente.get("asignacion", {})
                                    asesora_nombre = asignacion.get("asesora_nombre", "nuestra asesora comercial")
                                    asesora_telefono = asignacion.get("asesora_telefono", "")

                                    # Se actualiza el historial sin alterar el turno de las asesoras
                                    lead_doc_ref.update({
                                        "ultimo_mensaje": primer_texto,
                                        "actualizado_en": firestore.SERVER_TIMESTAMP
                                    })

                                    telefono_asesora_link = formatear_telefono(asesora_telefono)
                                    mensaje_reiteracion = (
                                        f"¡Hola de nuevo, {sender_name}! 👋\n\n"
                                        f"Recibimos tu mensaje: *\"{primer_texto}\"*\n\n"
                                        f"Tu asesora asignada *{asesora_nombre}* ya tiene tus datos y en breve se pondrá en contacto contigo.\n\n"
                                        f"📲 Si deseas comunicarte directamente con ella ahora mismo, puedes escribirle aquí:\n"
                                        f"https://wa.me/{telefono_asesora_link}"
                                    )

                                    payload_seguimiento = {
                                        "messaging_product": "whatsapp",
                                        "recipient_type": "individual",
                                        "to": formatear_telefono(sender_phone),
                                        "type": "text",
                                        "text": {"preview_url": True, "body": mensaje_reiteracion}
                                    }
                                    _enviar_payload_whatsapp(payload_seguimiento)
                                    print(f"🔄 Mensaje recurrente de {sender_phone}. Atendido por su asesora previa: {asesora_nombre}")

                                # =========================================
                                # CASO 2: CLIENTE COMPLETAMENTE NUEVO
                                # =========================================
                                else:
                                    referral = msg.get("referral", {})
                                    if referral:
                                        canal_origen = "Click to WhatsApp (Anuncio)"
                                        ad_id = str(referral.get("source_id", ""))
                                        ad_headline = referral.get("headline", "Anuncio Meta")
                                    else:
                                        canal_origen = "WhatsApp Directo (Carteles / QR / Lonas)"
                                        ad_id = ""
                                        ad_headline = "Publicidad Exterior"

                                    asesora = obtener_siguiente_asesora(proyecto_id)

                                    lead_data = {
                                        "lead_id": doc_id,
                                        "cliente": {
                                            "nombre": sender_name,
                                            "telefono": sender_phone
                                        },
                                        "origen": {
                                            "canal": canal_origen,
                                            "ad_id": ad_id,
                                            "ad_headline": ad_headline,
                                            "proyecto_id": proyecto_id
                                        },
                                        "asignacion": {
                                            "asesora_id": asesora["id"] if asesora else "sin_asignar",
                                            "asesora_nombre": asesora.get("nombre") if asesora else "Sin Asignar",
                                            "asesora_telefono": asesora.get("telefono") if asesora else "",
                                            "asignado_en": firestore.SERVER_TIMESTAMP
                                        },
                                        "primer_mensaje": primer_texto,
                                        "estado": "Nuevo",
                                        "creado_en": firestore.SERVER_TIMESTAMP
                                    }

                                    lead_doc_ref.set(lead_data, merge=True)
                                    
                                    if asesora:
                                        registrar_asignacion_asesora(asesora["id"])
                                        
                                        enviar_bienvenida_cliente(
                                            telefono_cliente=sender_phone,
                                            nombre_cliente=sender_name,
                                            asesora_nombre=asesora.get("nombre", "una asesora"),
                                            asesora_telefono=asesora.get("telefono", ""),
                                            proyecto_nombre="Lisboa Residencial"
                                        )
                                        
                                        if asesora.get("telefono"):
                                            enviar_alerta_asesora(
                                                asesora_telefono=asesora.get("telefono"),
                                                asesora_nombre=asesora.get("nombre", ""),
                                                nombre_cliente=sender_name,
                                                telefono_cliente=sender_phone,
                                                proyecto_nombre="Lisboa Residencial",
                                                primer_mensaje=f"[{canal_origen}] {primer_texto}"
                                            )
                                    print(f"🎯 Lead de WhatsApp NUEVO ({canal_origen}) {sender_phone} asignado a: {lead_data['asignacion']['asesora_nombre']}")

        return {"status": "success"}
    except Exception as e:
        print(f"❌ Error procesando el webhook: {e}")
        return {"status": "error"}

@app.post("/api/leads/web")
async def receive_web_lead(lead: WebLeadRequest):
    try:
        telefono_limpio = formatear_telefono(lead.telefono)
        doc_id = f"web_{telefono_limpio}_{int(datetime.now(timezone.utc).timestamp())}"
        
        asesora = obtener_siguiente_asesora(lead.proyecto_id)

        lead_data = {
            "lead_id": doc_id,
            "cliente": {
                "nombre": lead.nombre,
                "telefono": telefono_limpio,
                "email": lead.email
            },
            "origen": {
                "canal": "Landing Page Web",
                "fuente": lead.origen_utm,
                "proyecto_id": lead.proyecto_id
            },
            "asignacion": {
                "asesora_id": asesora["id"] if asesora else "sin_asignar",
                "asesora_nombre": asesora.get("nombre") if asesora else "Sin Asignar",
                "asesora_telefono": asesora.get("telefono") if asesora else "",
                "asignado_en": firestore.SERVER_TIMESTAMP
            },
            "primer_mensaje": lead.mensaje,
            "estado": "Nuevo",
            "creado_en": firestore.SERVER_TIMESTAMP
        }

        if db:
            db.collection("leads").document(doc_id).set(lead_data, merge=True)
            if asesora:
                registrar_asignacion_asesora(asesora["id"])
                if asesora.get("telefono"):
                    enviar_alerta_asesora(
                        asesora_telefono=asesora.get("telefono"),
                        asesora_nombre=asesora.get("nombre", ""),
                        nombre_cliente=lead.nombre,
                        telefono_cliente=telefono_limpio,
                        proyecto_nombre="Lisboa Residencial",
                        primer_mensaje=lead.mensaje or "Solicitó informes desde el formulario web."
                    )
                enviar_bienvenida_cliente(
                    telefono_cliente=telefono_limpio,
                    nombre_cliente=lead.nombre,
                    asesora_nombre=asesora.get("nombre", ""),
                    asesora_telefono=asesora.get("telefono", ""),
                    proyecto_nombre="Lisboa Residencial"
                )

        print(f"🌐 Lead Web {lead.nombre} ({telefono_limpio}) -> Asignado a: {lead_data['asignacion']['asesora_nombre']}")
        return {"status": "success", "lead_id": doc_id}
    except Exception as e:
        print(f"❌ Error al procesar lead web: {e}")
        raise HTTPException(status_code=500, detail="Error interno al guardar lead")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)