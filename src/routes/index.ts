import express, { Router } from 'express';
import auth from './auth.routes';
import shop from './shop/index';
import collabForum from './collab-forum/index';
import greenMap from './green-map/index';
import events from './events/index';
import sustainableInnovation from './sustainable-innovation/index';
import farm from './farm/index';
import waste from './waste/index';
import contentCreator from './content-creator/index';
import academy from './academy/index';
import gpt from './gpt/index';
import careers from './careers/index';
import leaderboard from './leaderboard';
import dashboard from './dashboard';
import setting from './settings/settings';
import pool from './pool/index';
import subscription from './subscription.routes';
import user from './users/index';
import notification from './notifications/notification';

const router: Router = express.Router();

router.use('/auth', auth);
router.use('/shop', shop);
router.use('/collab-forum', collabForum);
router.use('/green-map', greenMap);
router.use('/events', events);
router.use('/sustainable-innovation', sustainableInnovation);
router.use('/farm', farm);
router.use('/waste', waste);
router.use('/content-creator', contentCreator);
router.use('/academy', academy);
router.use('/gpt', gpt);
router.use('/careers', careers);
router.use('/leaderboard', leaderboard);
router.use('/carpool', pool);
router.use('/setting', setting);
router.use('/dashboard', dashboard);
router.use('/user', user);
router.use('/notification', notification);
router.use('/subscription', subscription);
router.use('/revenuecat', subscription); // Added to match https://api.mudeem.ae/revenuecat/webhook

export default router;
