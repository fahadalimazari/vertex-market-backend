import mongoose from 'mongoose';

const contactSettingSchema = new mongoose.Schema(
  {
    supportPhone: { type: String, default: '021-111-746-776' },
    emergencyContact: { type: String, default: '+92-300-9876543' },
    whatsapp: { type: String, default: 'https://wa.me/923009876543' },
    supportEmail: { type: String, default: 'support@vertex-market.com' },
    workingHours: { type: String, default: 'Mon - Sat: 9:00 AM to 9:00 PM (PKT)' },
    holidayHours: { type: String, default: 'Sundays & National Holidays: 11:00 AM to 5:00 PM (PKT)' },
    officeAddress: { type: String, default: 'Vertex Enterprise Tower, Suite 402, Main Shahrah-e-Faisal, Karachi, Pakistan' },
    mapUrl: { type: String, default: 'https://maps.google.com/?q=Shahrah-e-Faisal+Karachi' },
    liveChatEnabled: { type: Boolean, default: true },
    socialLinks: {
      facebook: { type: String, default: 'https://facebook.com/vertexmarket' },
      instagram: { type: String, default: 'https://instagram.com/vertexmarket' },
      twitter: { type: String, default: 'https://twitter.com/vertexmarket' },
      linkedin: { type: String, default: 'https://linkedin.com/company/vertexmarket' },
    }
  },
  { timestamps: true }
);

const ContactSetting = mongoose.model('ContactSetting', contactSettingSchema);
export default ContactSetting;
