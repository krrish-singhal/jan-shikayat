import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from './constants/languages.js';

// Locale namespace loaders
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enCitizen from './locales/en/citizen.json';
import enOperator from './locales/en/operator.json';
import enEngineer from './locales/en/engineer.json';
import enAdmin from './locales/en/admin.json';
import enValidation from './locales/en/validation.json';

import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiCitizen from './locales/hi/citizen.json';
import hiOperator from './locales/hi/operator.json';
import hiEngineer from './locales/hi/engineer.json';
import hiAdmin from './locales/hi/admin.json';
import hiValidation from './locales/hi/validation.json';

import mrCommon from './locales/mr/common.json';
import mrAuth from './locales/mr/auth.json';
import mrCitizen from './locales/mr/citizen.json';
import mrOperator from './locales/mr/operator.json';
import mrEngineer from './locales/mr/engineer.json';
import mrAdmin from './locales/mr/admin.json';
import mrValidation from './locales/mr/validation.json';

import bnCommon from './locales/bn/common.json';
import bnAuth from './locales/bn/auth.json';
import bnCitizen from './locales/bn/citizen.json';
import bnOperator from './locales/bn/operator.json';
import bnEngineer from './locales/bn/engineer.json';
import bnAdmin from './locales/bn/admin.json';
import bnValidation from './locales/bn/validation.json';

import paCommon from './locales/pa/common.json';
import paAuth from './locales/pa/auth.json';
import paCitizen from './locales/pa/citizen.json';
import paOperator from './locales/pa/operator.json';
import paEngineer from './locales/pa/engineer.json';
import paAdmin from './locales/pa/admin.json';
import paValidation from './locales/pa/validation.json';

import guCommon from './locales/gu/common.json';
import guAuth from './locales/gu/auth.json';
import guCitizen from './locales/gu/citizen.json';
import guOperator from './locales/gu/operator.json';
import guEngineer from './locales/gu/engineer.json';
import guAdmin from './locales/gu/admin.json';
import guValidation from './locales/gu/validation.json';

import taCommon from './locales/ta/common.json';
import taAuth from './locales/ta/auth.json';
import taCitizen from './locales/ta/citizen.json';
import taOperator from './locales/ta/operator.json';
import taEngineer from './locales/ta/engineer.json';
import taAdmin from './locales/ta/admin.json';
import taValidation from './locales/ta/validation.json';

import teCommon from './locales/te/common.json';
import teAuth from './locales/te/auth.json';
import teCitizen from './locales/te/citizen.json';
import teOperator from './locales/te/operator.json';
import teEngineer from './locales/te/engineer.json';
import teAdmin from './locales/te/admin.json';
import teValidation from './locales/te/validation.json';

import knCommon from './locales/kn/common.json';
import knAuth from './locales/kn/auth.json';
import knCitizen from './locales/kn/citizen.json';
import knOperator from './locales/kn/operator.json';
import knEngineer from './locales/kn/engineer.json';
import knAdmin from './locales/kn/admin.json';
import knValidation from './locales/kn/validation.json';

import mlCommon from './locales/ml/common.json';
import mlAuth from './locales/ml/auth.json';
import mlCitizen from './locales/ml/citizen.json';
import mlOperator from './locales/ml/operator.json';
import mlEngineer from './locales/ml/engineer.json';
import mlAdmin from './locales/ml/admin.json';
import mlValidation from './locales/ml/validation.json';

import orCommon from './locales/or/common.json';
import orAuth from './locales/or/auth.json';
import orCitizen from './locales/or/citizen.json';
import orOperator from './locales/or/operator.json';
import orEngineer from './locales/or/engineer.json';
import orAdmin from './locales/or/admin.json';
import orValidation from './locales/or/validation.json';

import asCommon from './locales/as/common.json';
import asAuth from './locales/as/auth.json';
import asCitizen from './locales/as/citizen.json';
import asOperator from './locales/as/operator.json';
import asEngineer from './locales/as/engineer.json';
import asAdmin from './locales/as/admin.json';
import asValidation from './locales/as/validation.json';

const resources = {
  en: { common: enCommon, auth: enAuth, citizen: enCitizen, operator: enOperator, engineer: enEngineer, admin: enAdmin, validation: enValidation },
  hi: { common: hiCommon, auth: hiAuth, citizen: hiCitizen, operator: hiOperator, engineer: hiEngineer, admin: hiAdmin, validation: hiValidation },
  mr: { common: mrCommon, auth: mrAuth, citizen: mrCitizen, operator: mrOperator, engineer: mrEngineer, admin: mrAdmin, validation: mrValidation },
  bn: { common: bnCommon, auth: bnAuth, citizen: bnCitizen, operator: bnOperator, engineer: bnEngineer, admin: bnAdmin, validation: bnValidation },
  pa: { common: paCommon, auth: paAuth, citizen: paCitizen, operator: paOperator, engineer: paEngineer, admin: paAdmin, validation: paValidation },
  gu: { common: guCommon, auth: guAuth, citizen: guCitizen, operator: guOperator, engineer: guEngineer, admin: guAdmin, validation: guValidation },
  ta: { common: taCommon, auth: taAuth, citizen: taCitizen, operator: taOperator, engineer: taEngineer, admin: taAdmin, validation: taValidation },
  te: { common: teCommon, auth: teAuth, citizen: teCitizen, operator: teOperator, engineer: teEngineer, admin: teAdmin, validation: teValidation },
  kn: { common: knCommon, auth: knAuth, citizen: knCitizen, operator: knOperator, engineer: knEngineer, admin: knAdmin, validation: knValidation },
  ml: { common: mlCommon, auth: mlAuth, citizen: mlCitizen, operator: mlOperator, engineer: mlEngineer, admin: mlAdmin, validation: mlValidation },
  or: { common: orCommon, auth: orAuth, citizen: orCitizen, operator: orOperator, engineer: orEngineer, admin: orAdmin, validation: orValidation },
  as: { common: asCommon, auth: asAuth, citizen: asCitizen, operator: asOperator, engineer: asEngineer, admin: asAdmin, validation: asValidation },
};

const detectorOptions = {
  order: ['localStorage', 'navigator'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    defaultNS: 'common',
    ns: ['common', 'auth', 'citizen', 'operator', 'engineer', 'admin', 'validation'],
    detection: detectorOptions,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
