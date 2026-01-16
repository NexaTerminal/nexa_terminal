# Course Plan: Извршување врз недвижности

## Overview
**Course ID:** `izvrsuvanje-nedviznosti`
**Title:** Извршување врз недвижности
**Description:** Комплетен курс за постапката на извршување врз недвижности - од прибелешка до намирување на доверителите.

---

## Course Structure (6 Modules + Final Test)

### Module 1: Вовед во постапката за извршување
**Video:** https://www.youtube.com/watch?v=imAWHrYOVUQ (videoId: `imAWHrYOVUQ`)

**Reading Content:**
- Општи одредби за извршување врз недвижности (Член 166)
- Дејствија на извршувањето: прибелешка, утврдување вредност, продажба, намирување
- Право на должникот за замена на средството (Член 167)

**Quiz 1:** 3-4 прашања од модулот

---

### Module 2: Прибелешка и право на намирување
**Video:** https://www.youtube.com/watch?v=LDT5XHoOotU (videoId: `LDT5XHoOotU`)

**Reading Content:**
- Прибелешка за извршувањето во јавна книга (Член 168)
- Стекнување право на намирување
- Пристапување кон извршувањето (Член 169)
- Намирување на заложен доверител (Член 170)

**Quiz 2:** 3-4 прашања од модулот

---

### Module 3: Утврдување на вредноста на недвижноста
**Video:** https://www.youtube.com/watch?v=_o_EexOQroU (videoId: `_o_EexOQroU`)

**Reading Content:**
- Начин на утврдување на вредноста (Член 176)
- Улога на овластен проценител
- Рок за проценка (8 дена, максимум 30)
- Заклучок за утврдување на вредноста (Член 177)
- Гаранција за учество од 1/10

**Quiz 3:** 3-4 прашања од модулот

---

### Module 4: Процес на продажба
**Video:** https://www.youtube.com/watch?v=-d4BOXJCz4c (videoId: `-d4BOXJCz4c`)

**Reading Content:**
- Прво усно јавно наддавање (Член 179)
- Услови за продажбата (Член 182)
- Полагање гаранција 1/10 (Член 183)
- Второ јавно наддавање со попуст (1/3)
- Продажба со непосредна спогодба
- Кој не смее да купува

**Quiz 4:** 3-4 прашања од модулот

---

### Module 5: Намирување и сопственост
**Video:** https://www.youtube.com/watch?v=8L2we3HsBpc (videoId: `8L2we3HsBpc`)

**Reading Content:**
- Заклучок за извршена продажба
- Запишување на сопственоста во Катастар
- Редослед на првенствено намирување:
  1. Трошоци на извршувањето и ДДВ
  2. Данок на имот за последната година
  3. Заложни доверители (хипотеки) по ред на запишување
  4. Доверителот што го барал извршувањето

**Quiz 5:** 3-4 прашања од модулот

---

### Module 6: Предавање на имотот и завршување
**Video:** https://www.youtube.com/watch?v=IQeYqQ7PzhI (videoId: `IQeYqQ7PzhI`)

**Reading Content:**
- Рок за испразнување на имотот (30 дена)
- Престанување на залогот (Член 171)
- Службености и реални товари (Член 172)
- Закуп на станбена/деловна зграда (Член 173)
- Изземање од извршување (Член 175)

**Infographic Image:** `/images/education/izvrsuvanje-vodich.png`
(Водич низ постапката за извршување врз недвижности)

**Quiz 6:** 3-4 прашања од модулот

---

### Module 7: Финален тест
**Final Quiz:** 10 прашања од сите модули
- Passing score: 70%
- Questions covering all 6 modules

---

## Files to Create/Modify

### 1. Client Data File
**Path:** `/client/src/data/courseData.js`
- Add new course entry in `courseData`
- Add all reading content in `readingContent`
- Add all quizzes in `quizData`

### 2. Server Data File (Mirror)
**Path:** `/server/data/courseData.js`
- Same content as client file

### 3. Infographic Image
**Source:** `/Users/martinboshkoski/Desktop/tax sources/unnamed.png`
**Destination:** `/client/public/images/education/izvrsuvanje-vodich.png`

---

## Video IDs Summary
| Module | YouTube URL | Video ID |
|--------|-------------|----------|
| 1 | https://www.youtube.com/watch?v=imAWHrYOVUQ | imAWHrYOVUQ |
| 2 | https://www.youtube.com/watch?v=LDT5XHoOotU | LDT5XHoOotU |
| 3 | https://www.youtube.com/watch?v=_o_EexOQroU | _o_EexOQroU |
| 4 | https://www.youtube.com/watch?v=-d4BOXJCz4c | -d4BOXJCz4c |
| 5 | https://www.youtube.com/watch?v=8L2we3HsBpc | 8L2we3HsBpc |
| 6 | https://www.youtube.com/watch?v=IQeYqQ7PzhI | IQeYqQ7PzhI |

---

## Lesson Structure per Module
Each module follows this pattern:
1. **Video** (~15 min) - YouTube embed
2. **Reading** (~10 min) - Text content from document
3. **Quiz** (~5 min) - 3-4 multiple choice questions

Module 6 includes an additional **Infographic** element before the quiz.

---

## Quiz Questions Preview

### Quiz 1 (Вовед)
- Кои се дејствијата на извршувањето врз недвижности?
- Кој може да предложи замена на средството за извршување?
- Во кој рок должникот може да предложи извршување врз друга недвижност?

### Quiz 2 (Прибелешка)
- Што се стекнува со прибелешка на налогот во јавната книга?
- До кога може да се пристапи кон извршувањето?
- Што се случува со заложниот доверител кој не барал извршување?

### Quiz 3 (Вредност)
- Кој ја утврдува вредноста на недвижноста?
- Во кој рок проценителот мора да достави процена?
- Колку изнесува максималниот рок за продолжување на проценката?

### Quiz 4 (Продажба)
- На кој начин може да се продаде недвижноста?
- Колку изнесува гаранцијата за учество во наддавање?
- Под која цена не може да се продаде недвижноста на прво наддавање?

### Quiz 5 (Намирување)
- Кој е редоследот на првенствено намирување?
- Што се добива со заклучокот за извршена продажба?
- Каде се запишува сопственоста по продажба?

### Quiz 6 (Предавање)
- Во кој рок должникот мора да го испразни имотот?
- Што се случува со службеностите врз недвижноста?
- Што се случува со договорите за закуп склучени по барањето за извршување?

### Final Quiz
- 10 прашања покривајќи ги сите теми од курсот

---

## Implementation Steps

1. **Copy infographic image** to `/client/public/images/education/`
2. **Update `/client/src/data/courseData.js`:**
   - Add course metadata to `courseData`
   - Add 7 reading entries to `readingContent` (6 modules + infographic section)
   - Add 7 quiz entries to `quizData` (6 module quizzes + final)
3. **Update `/server/data/courseData.js`** - Mirror the client changes
4. **Test the course** in development environment

---

## Ready for Execution?
Please review this plan and confirm if you'd like me to proceed with implementation.
