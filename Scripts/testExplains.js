const mongoose = require('mongoose');
const User = require('../models/user');
const explainEmail = await User.find({ email: 'test@example.com' }).explain('executionStats');
console.log('Email index usage:', explainEmail.executionStats.executionStages.inputStage);
