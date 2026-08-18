import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // e.g., 'en', 'ur', 'ar'
    name: { type: String, required: true }, // e.g., 'English', 'Urdu', 'Arabic'
    nativeName: { type: String }, // e.g., 'English', 'اردو', 'العربية'
    flag: { type: String, default: '🇺🇸' },
    isRtl: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    translationProgress: { type: Number, default: 100 }, // e.g., 100%, 85%
    autoTranslationEnabled: { type: Boolean, default: true },
    translations: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const Language = mongoose.model('Language', languageSchema);
export default Language;
