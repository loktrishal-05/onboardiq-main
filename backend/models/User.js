import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'Software Engineer', trim: true },
  department: { type: String, default: 'Engineering', trim: true },
  seniority: { type: String, default: 'L3' },
  location: { type: String, default: 'Remote' },
  startDate: { type: Date, default: Date.now },
  avatar: { type: String, default: '' },
  provider: { type: String, default: 'local' },
  completedTasks: [{ type: String }],
  onboardingPlan: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
