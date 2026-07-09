  // MAIL PARA CREACION DE TURNOS
  //   await this.notificationsService.sendAppointmentCreationEmail(
  //     newCustomer.email ?? '',
  //     'Turno creado',
  //     `
  // Hola ${newCustomer.name} 👋

  // Tu turno fue confirmado correctamente.

  // 📅 Fecha: 12/07/2026
  // 🕒 Hora: 15:30
  // 💇 Servicio: Corte de pelo

  // ¡Te esperamos!
  // `,
  //   );


import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { envs } from '../common/configs/envs';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(envs.resendApiKey);
  }

  // ======== TEMPLATE BASE (privado) ======== //
  private renderTemplate(text: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:40px;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0"
              style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                     overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.08);">
              <tr>
                <td style="background:#2563eb;padding:30px;text-align:center;">
                  <h1 style="margin:0;color:white;font-size:28px;">Flexio</h1>
                  <p style="color:#dbeafe;margin-top:8px;font-size:15px;">Sistema de gestión</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <div style="color:#374151;font-size:16px;line-height:1.8;white-space:pre-line;">
                    ${text}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;text-align:center;padding:24px;
                           color:#6b7280;font-size:13px;line-height:1.6;">
                  Este correo fue enviado automáticamente por <strong>Flexio</strong>.
                  <br><br>Por favor, no respondas este mensaje.
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }

  // ======== MÉTODO BASE (privado) ======== //
  private async send(to: string, subject: string, text: string): Promise<void> {
    await this.resend.emails.send({
      from: envs.resendFromEmail,
      to: [to],
      subject,
      html: this.renderTemplate(text),
    });
  }

  // ======== EMAILS PÚBLICOS ======== //
  async sendAppointmentConfirmation(to: string, data: {
    customerName: string;
    serviceName: string;
    employeeName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.send(
      to,
      'Confirmación de tu turno — Flexio',
      `Hola ${data.customerName},

   Tu turno fue confirmado con éxito.

   Servicio:   ${data.serviceName}
   Profesional: ${data.employeeName}
   Fecha:      ${data.date}
   Hora:       ${data.time}

   Te esperamos.`,
    );
  }

  async sendAppointmentReminder(to: string, data: {
    customerName: string;
    serviceName: string;
    employeeName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.send(
      to,
      'Recordatorio: tu turno es mañana — Flexio',
      `Hola ${data.customerName},

   Te recordamos que mañana tenés un turno agendado.

   Servicio:   ${data.serviceName}
   Profesional: ${data.employeeName}
   Fecha:      ${data.date}
   Hora:       ${data.time}

   Si necesitás cancelar, comunicate con el negocio.`,
    );
  }
}
