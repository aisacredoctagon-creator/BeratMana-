import type { QType } from '../../config/difficulty';
import { addType } from './add';
import type { QuestionTypeDef } from './def';
import { decimalType } from './decimal';
import { divType } from './div';
import { fractionType } from './fraction';
import { mulType } from './mul';
import { subType } from './sub';

/** Daftar tipe soal. Tipe baru: buat file baru lalu daftarkan di sini (dan di QTYPES, lihat README). */
export const TYPE_DEFS: Record<QType, QuestionTypeDef> = {
  add: addType,
  sub: subType,
  mul: mulType,
  div: divType,
  fraction: fractionType,
  decimal: decimalType,
};
