const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();
const Document = require('../models/document');
const Review = require('../models/review');
const Log = require('../models/log');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // const Userindexes = await User.collection.getIndexes();
    // console.log('User Indexes:', Userindexes); 
    // const Documentindexes = await Document.collection.getIndexes();
    // console.log('Document Indexes:', Documentindexes);
    // const Reviewindexes = await Review.collection.getIndexes();
    // console.log('Review Indexes:', Reviewindexes);
    // const Logindexes = await Log.collection.getIndexes();
    // console.log('Log Indexes:', Logindexes);

    // Testing if the queries will use the indexes created or not 

    // USER MODEL ::

    //user email

    // const explainEmail = await User.find({ email: 'test@example.com' }).explain('executionStats');

    // console.dir(explainEmail.executionStats.executionStages, { depth: null });
    // function findIxscanStage(stage) {
    //   if (!stage) return null;
    //   if (stage.stage === 'IXSCAN') return stage;
    //   return findIxscanStage(stage.inputStage || stage.innerStage);
    // }

    // const ixscanStage = findIxscanStage(explainEmail.executionStats.executionStages);
    // console.log('📊 Actual index scan stage:', ixscanStage);

    // user phone
    
    // const explainPhone = await User.find({ phone: '01012345678' }).explain('executionStats');
    // console.dir(explainPhone.executionStats.executionStages, { depth: null });

    // function findIxscanStage(stage) {
    //   if (!stage) return null;
    //   if (stage.stage?.includes('IXSCAN')) return stage;
    //   return findIxscanStage(stage.inputStage || stage.innerStage);
    // }

    // DOCUMENT MODEL ::

    // user ID

    // const explainDocUser = await Document.find({ 'user._id': "6861e2c7d37cedbbe98a3239" }).explain('executionStats');
    // console.dir(explainDocUser.executionStats.executionStages, { depth: null });

    // document status 

    // const explainStatus = await Document.find({ status: 'approved' }).explain('executionStats');
    // console.dir(explainStatus.executionStats.executionStages, { depth: null });

    // document creation time 

    // const explainRecentDocs = await Document.find().sort({ createdAt: -1 }).explain('executionStats');
    // console.dir(explainRecentDocs.executionStats.executionStages, { depth: null });

    // User ID + document Status 

    // const explainCompound = await Document.find({
    //   'user._id': "6861e2c7d37cedbbe98a3239",
    //   status: 'approved',
    // }).explain('executionStats');

    // console.dir(explainCompound.executionStats.executionStages, { depth: null });


    // REVIEW MODEL ::

    // document ID 

    // const explainReviewByDoc = await Review.find({
    //   'document._id': "685dbebb03a15971f821873a",
    // }).explain('executionStats');

    // console.dir(explainReviewByDoc.executionStats.executionStages, { depth: null });

    // reviewed by .id

    // const explainByAdmin = await Review.find({
    //   'reviewedBy._id': new mongoose.Types.ObjectId('685894775d28a948eb1bc10d'),      
    // }).explain('executionStats');

    // console.dir(explainByAdmin.executionStats.executionStages, { depth: null });


    // Status + Created At

    // const explainByStatusAndTime = await Review.find({
    //   status: 'rejected',
    // }).sort({ createdAt: -1 }).explain('executionStats');

    // console.dir(explainByStatusAndTime.executionStats.executionStages, { depth: null });


    // LOGS MODEL

    // action 

    // const explainLogByAction = await Log.find({
    //   action: 'login',
    // }).explain('executionStats');

    // console.dir(explainLogByAction.executionStats.executionStages, { depth: null });


    // createdAt
    // const explainSortedLogs = await Log.find().sort({ createdAt: -1 }).limit(5).explain('executionStats');

    // console.dir(explainSortedLogs.executionStats.executionStages, { depth: null });

    // actor + createdAt

    
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
};

run();
