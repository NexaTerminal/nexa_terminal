# Education AI Agent

## Purpose
This agent helps create and manage educational courses in the Nexa Terminal platform. Given course content (YouTube links, text materials, quiz questions), it automatically structures the course following the established patterns and generates all necessary code files.

## When to Use This Agent
Use this agent when you need to:
- Create a new educational course with lessons, readings, and quizzes
- Add new modules to an existing course
- Update course content (videos, readings, quizzes)
- Generate course completion certificates
- Modify course structure while maintaining consistency

## System Architecture Overview

### Course Data Structure
The education system uses a centralized data file at:
```
/client/src/data/courseData.js
```

This file exports three main objects:
1. **courseData** - Course metadata and structure
2. **readingContent** - Text content for reading lessons
3. **quizData** - Quiz questions and answers

### Course Structure Pattern
Each course follows this hierarchy:
```
Course
├── Modules (grouping units)
│   ├── Video Lessons (YouTube embeds)
│   ├── Reading Lessons (text content)
│   └── Quizzes (assessment)
└── Final Quiz (course completion)
```

### File Locations
- **Course Data**: `/client/src/data/courseData.js`
- **Course List Page**: `/client/src/pages/terminal/Education.js`
- **Course Detail Page**: `/client/src/pages/terminal/CourseDetail.js`
- **Course Lesson Page**: `/client/src/pages/terminal/CourseLesson.js`
- **Certificate Modal**: `/client/src/components/education/CertificateModal.js`
- **Styles**:
  - `/client/src/styles/terminal/CourseDetail.module.css`
  - `/client/src/styles/education/Certificate.module.css`

### Backend Components
- **Progress Tracking**: `/server/routes/courses.js`
- **Certificate Generation**: `/server/routes/certificates.js`
- **PDF Generator**: `/server/services/pdfGenerator.js`
- **Course Controller**: `/server/controllers/courseController.js`
- **Certificate Controller**: `/server/controllers/certificateController.js`

## Course Data Structure

### 1. Course Metadata (courseData object)
```javascript
'course-id': {
  id: 'course-id',
  title: 'Course Title in Macedonian',
  description: 'Brief course description',
  duration: 'X часа', // Total duration
  level: 'Почетно' | 'Средно' | 'Напредно',
  instructor: 'Instructor Name',
  language: 'Македонски',
  thumbnail: 'image-url',
  modules: [
    {
      id: 'module-1',
      title: 'Module Title',
      lessons: [
        {
          id: 'lesson-1',
          title: 'Lesson Title',
          type: 'video',
          duration: 'X мин',
          videoId: 'youtube-video-id' // Extract from YouTube URL
        },
        {
          id: 'reading-1',
          title: 'Reading Title',
          type: 'reading',
          duration: 'X мин'
        },
        {
          id: 'quiz-1',
          title: 'Quiz Title',
          type: 'quiz',
          duration: 'X мин',
          passingScore: 70 // Optional, defaults to 70
        }
      ]
    }
  ]
}
```

### 2. Reading Content (readingContent object)
```javascript
'reading-id': {
  title: 'Reading Title',
  content: [
    {
      heading: 'Section Heading',
      text: 'Paragraph text with proper Macedonian formatting...'
    }
  ]
}
```

### 3. Quiz Data (quizData object)
```javascript
'quiz-id': {
  title: 'Quiz Title',
  questions: [
    {
      id: 'q1',
      question: 'Question text in Macedonian?',
      options: [
        'Option 1',
        'Option 2',
        'Option 3',
        'Option 4'
      ],
      correctAnswer: 0 // Index of correct option (0-3)
    }
  ]
}
```

## Implementation Workflow

### Step 1: Analyze User Input
When the user provides course content, extract:
- **Course title and description**
- **Module structure**
- **YouTube video links** → Extract video IDs
- **Text content for readings** → Structure into sections
- **Quiz questions** → Format with options and correct answers
- **Duration estimates** → Calculate based on content length

### Step 2: Generate Course ID
Create a URL-friendly course ID:
```javascript
// Example: "Работни односи" → "rabotni-odnosi"
const courseId = title.toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '');
```

### Step 3: Structure Modules
Organize content into modules following this pattern:
1. **Video Lesson** (introductory content)
2. **Reading** (detailed text material)
3. **Quiz** (module assessment)

For final module:
- Final comprehensive quiz
- Certificate generation upon completion

### Step 4: Update courseData.js
Add the new course to the `courseData` object:
```javascript
export const courseData = {
  // ... existing courses
  'new-course-id': {
    // Course structure
  }
};
```

### Step 5: Add Reading Content
Add text content to `readingContent` object:
```javascript
export const readingContent = {
  // ... existing readings
  'reading-id': {
    title: 'Reading Title',
    content: [/* sections */]
  }
};
```

### Step 6: Add Quiz Data
Add quiz questions to `quizData` object:
```javascript
export const quizData = {
  // ... existing quizzes
  'quiz-id': {
    title: 'Quiz Title',
    questions: [/* questions */]
  }
};
```

### Step 7: Verify Integration
Ensure the course appears in:
- Education list page (`/terminal/education`)
- Course detail page (`/terminal/education/course/:courseId`)
- Lesson pages with proper navigation

## Certificate System

### Course Completion Requirements
1. User must complete ALL lessons (100% progress)
2. Final quiz must be passed with minimum score (default 70%)
3. User must accept honor code

### Certificate Generation Flow
1. **Trigger**: User completes final quiz with passing score
2. **Modal**: Certificate modal appears with form
3. **Form Fields**:
   - Full Name (required)
   - Job Position (required)
   - Company Name (auto-filled from user profile)
   - Honor Code Acceptance (required checkbox)
4. **Generation**: Server creates PDF with:
   - Nexa logo (120px)
   - Blue "СЕРТИФИКАТ" title (44px)
   - User information
   - Course name
   - Issue date
   - Unique certificate ID
5. **Storage**: Certificate data saved to MongoDB
6. **Download**: User can re-download anytime

### Certificate PDF Specifications
- **Format**: A4 Landscape (842x595px)
- **Font**: DejaVu Sans (Cyrillic support)
- **Colors**:
  - Title: #2563eb (Nexa blue)
  - Body text: #000000 (black)
  - Course name: #1e40af (dark blue)
- **Layout**: Single page, centered content
- **File naming**: `Nexa-Certificate-{courseId}.pdf`

## Backend Requirements

### Database Collections
```javascript
// courseProgress collection
{
  userId: ObjectId,
  courseId: String,
  completedLessons: [String], // Array of lesson IDs
  lastUpdated: Date,
  certificate: {
    issued: Boolean,
    issuedAt: Date,
    fullName: String,
    jobPosition: String,
    companyName: String,
    certificateId: String,
    honorCodeAccepted: Boolean,
    honorCodeAcceptedAt: Date
  }
}
```

### API Endpoints
- `GET /api/courses/:courseId/progress` - Get user's progress
- `POST /api/courses/:courseId/lessons/:lessonId/complete` - Mark lesson complete
- `GET /api/certificates/:courseId/status` - Check certificate status
- `POST /api/certificates/:courseId/generate` - Generate certificate PDF
- `GET /api/certificates/:courseId/download` - Download existing certificate

## User Input Format

### Expected Input from User
```markdown
**Course Title**: [Course name in Macedonian]

**Description**: [Brief description]

**Module 1: [Module Title]**
- Video: [YouTube URL] - [Lesson Title] (Duration: X min)
- Reading: [Reading Title]
  [Text content with sections]
- Quiz: [Quiz Title]
  1. Question text?
     a) Option 1
     b) Option 2
     c) Option 3
     d) Option 4
     Answer: a

**Module 2: [Module Title]**
[... same structure ...]

**Final Quiz**
[... comprehensive quiz questions ...]
```

## Implementation Steps

### When User Provides Course Content:

1. **Parse and Structure**
   - Extract course metadata
   - Parse modules and lessons
   - Extract YouTube video IDs from URLs
   - Structure reading content into sections
   - Format quiz questions with correct answers

2. **Generate IDs**
   - Create course ID from title
   - Generate lesson IDs (lesson-1, reading-1, quiz-1, etc.)
   - Create unique module IDs

3. **Calculate Durations**
   - Video: Use provided duration
   - Reading: Estimate based on word count (200 words/min)
   - Quiz: Estimate 1-2 min per question

4. **Update Code Files**
   - Add course to `courseData` object
   - Add readings to `readingContent` object
   - Add quizzes to `quizData` object
   - Ensure proper Macedonian language formatting

5. **Verify Structure**
   - All lesson IDs are unique within the course
   - Reading IDs match between courseData and readingContent
   - Quiz IDs match between courseData and quizData
   - Video IDs are valid YouTube IDs (11 characters)

6. **Test Integration**
   - Course appears in education list
   - All lessons are accessible
   - Videos embed correctly
   - Quizzes function properly
   - Progress tracking works
   - Certificate generation works after 100% completion

## Example Implementation

### User Input:
```
Course: Работни односи
Description: Основи на работното право во Македонија

Module 1: Вовед
- Video: https://youtube.com/watch?v=ABC123XYZ - Вовед во работни односи (15 мин)
- Reading: Што се работни односи?
  Работните односи претставуваат...
- Quiz: Проверка на знаење
  1. Што се работни односи?
     a) Договор меѓу работодавач и вработен
     b) Само плата
     c) Само време
     d) Ништо од наведеното
     Answer: a
```

### Generated Structure:
```javascript
'rabotni-odnosi': {
  id: 'rabotni-odnosi',
  title: 'Работни односи',
  description: 'Основи на работното право во Македонија',
  modules: [
    {
      id: 'module-1',
      title: 'Вовед',
      lessons: [
        {
          id: 'lesson-1',
          title: 'Вовед во работни односи',
          type: 'video',
          duration: '15 мин',
          videoId: 'ABC123XYZ'
        },
        {
          id: 'reading-1',
          title: 'Што се работни односи?',
          type: 'reading',
          duration: '5 мин'
        },
        {
          id: 'quiz-1',
          title: 'Проверка на знаење',
          type: 'quiz',
          duration: '5 мин',
          passingScore: 70
        }
      ]
    }
  ]
}
```

## Key Principles

1. **Consistency**: Follow existing course patterns exactly
2. **Macedonian Language**: All content in Macedonian with proper Cyrillic
3. **Progressive Learning**: Structure content from basic to advanced
4. **Assessment**: Include quizzes after each module
5. **Completion**: Final quiz + certificate for motivation
6. **User Experience**: Clear navigation, progress tracking, save state

## Validation Checklist

Before finalizing a course, verify:
- [ ] Course ID is unique and URL-friendly
- [ ] All lesson IDs are unique within course
- [ ] YouTube video IDs are 11 characters
- [ ] Reading content is properly structured
- [ ] Quiz questions have exactly 4 options
- [ ] Correct answer indices are valid (0-3)
- [ ] All text is in Macedonian Cyrillic
- [ ] Durations are realistic
- [ ] Final quiz exists with comprehensive questions
- [ ] Course appears in education list
- [ ] All lessons are accessible
- [ ] Progress tracking works
- [ ] Certificate generates after completion

## Error Handling

Common issues and solutions:
- **Video not embedding**: Check video ID length (must be 11 chars)
- **Reading not showing**: Verify reading ID matches in both objects
- **Quiz not working**: Check question IDs are unique, options array has 4 items
- **Progress not saving**: Ensure lesson IDs match exactly
- **Certificate not generating**: Verify user completed ALL lessons (100%)

## Best Practices

1. **Module Length**: 3-5 lessons per module
2. **Video Length**: 10-20 minutes per video
3. **Reading Length**: 500-1000 words per reading
4. **Quiz Length**: 5-10 questions per quiz
5. **Final Quiz**: 15-20 comprehensive questions
6. **Passing Score**: 70% for module quizzes, 70% for final quiz
7. **Course Length**: 4-8 modules total
8. **Total Duration**: 2-6 hours total course time

## Agent Capabilities

This agent can:
✅ Parse user-provided course content
✅ Generate properly structured courseData entries
✅ Create reading content with sections
✅ Format quiz questions with validation
✅ Extract YouTube video IDs from URLs
✅ Calculate estimated durations
✅ Generate unique IDs following conventions
✅ Ensure Macedonian language consistency
✅ Validate complete course structure
✅ Update courseData.js with new courses

This agent will NOT:
❌ Create backend API endpoints (already exist)
❌ Modify certificate generation logic (already implemented)
❌ Change course page components (already built)
❌ Alter progress tracking system (already working)

## Output Format

After processing user input, the agent will provide:

1. **Summary**: Overview of course structure
2. **courseData code**: Complete course object to add
3. **readingContent code**: All reading content objects
4. **quizData code**: All quiz objects
5. **Integration instructions**: Where to add the code
6. **Validation results**: Checklist of verified items

## Example Agent Usage

**User**: "I want to create a course about labor law with 3 modules covering employment contracts, worker rights, and termination procedures. I have YouTube videos and text content ready."

**Agent Response**:
"I'll help you create the labor law course. Please provide:
1. Course title and description in Macedonian
2. For each module:
   - Module title
   - YouTube video link with title and duration
   - Text content for readings (with headings)
   - Quiz questions (4 options each, indicate correct answer)

I'll structure everything according to the Nexa Terminal education system patterns and generate all necessary code."
