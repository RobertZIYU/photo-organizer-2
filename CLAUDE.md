# Claude Code Project Configuration

## Photo Organizer Desktop Application

This project is building a desktop photo organization application based on the React demo component found in `/Users/robertye/Downloads/photo-organize-demo.tsx`.

### 📋 Key Documents
- **Main Reference**: `DEVELOPMENT_PLAN.md` - Complete development roadmap with acceptance criteria
- **Product Requirements**: `context/PRD.md` - Product requirements based on demo analysis
- **Session Context**: `context/` - Session summaries and project history

The comprehensive development plan outlines the complete transformation from demo to production desktop application including:
- Electron + React architecture
- Real file system integration
- AI processing pipeline
- Testing with Playwright MCP
- Cross-platform deployment

### 🎯 Project Goals
- Transform React demo into fully functional desktop app
- Implement real AI-powered photo organization
- Add comprehensive testing with screenshot validation
- Achieve 99% completion target before user testing
- Enable `npm run dev` for immediate testing

### 🔧 Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run all tests
npm run test:e2e     # Run Playwright tests with screenshots
```

### 📝 Instructions for Claude

#### Work Flow Commands
- **"continue working on the plan"** → Read `DEVELOPMENT_PLAN.md` and continue with current phase
- **"update the plan"** → Modify `DEVELOPMENT_PLAN.md` based on new requirements
- **"test and take screenshots"** → Use Playwright MCP to validate UI and capture results
- **"check the result"** → Run tests and verify against current step's acceptance criteria
- **"save summary"** → Generate session summary in `context/session-YYYY-MM-DD-HH-MM.md`

#### 📂 Context Management
**When to read context files:**
- **PRD Reference**: Read `context/PRD.md` when clarifying product requirements or user expectations
- **Session History**: Read latest session summary when resuming work to understand previous progress
- **Major Changes**: Update `claude.md` directly when project structure or workflows change significantly

**Auto-context triggers:**
- Read latest session summary when starting any "continue" command
- Reference PRD when validating user experience requirements
- Update claude.md when adding new phases, tools, or critical workflows

#### 🚫 Critical Rules - DO NOT DEVIATE
1. **NEVER stop until ALL acceptance criteria for the current step are met**
2. **When errors occur, fix them immediately - DO NOT ask for permission**
3. **Only mark a step complete when every acceptance criterion passes**
4. **Use Playwright MCP to validate each criterion with screenshots**
5. **If tests fail, iterate until they pass - no exceptions**

#### ✅ Step Completion Protocol
**ONLY mark a step complete when:**
- ✅ Every single acceptance criterion from `DEVELOPMENT_PLAN.md` is verified
- ✅ Playwright tests pass for all criteria
- ✅ Screenshots confirm expected behavior
- ✅ Performance targets are met (timing, memory, accuracy)
- ✅ Error handling works as specified
- ✅ Cross-platform compatibility confirmed (when applicable)

#### 🔧 Error Handling Protocol
**When errors occur:**
1. **Immediately diagnose and fix** - no questions asked
2. **Re-run tests** until all criteria pass
3. **Document fixes** in code comments if needed
4. **Continue** with the same step until 100% success
5. **Never** move to next step with failing criteria

#### 📊 Progress Tracking
- Use TodoWrite to track step-by-step progress within each phase
- Mark criteria as ✅ only when actually verified
- Screenshot every major milestone for validation
- Keep detailed logs of what was tested and verified

### ✅ Project Completion Criteria
**The entire project is only complete when:**
- All 6 phases and 31 steps have met their acceptance criteria
- Full end-to-end workflow tested with real photos
- `npm run dev` starts a fully functional application
- User can organize 1000+ photos successfully
- All Playwright tests pass with visual validation

### 🧪 Testing Protocol
- Use Playwright MCP for automated E2E testing
- Capture screenshots at each major workflow step
- Validate file operations with real photo datasets
- Test cross-platform compatibility
- Benchmark performance with large photo collections (1000+ photos)

### 🎯 Phase Completion Verification (REQUIRED)

**CRITICAL: After completing ANY major phase, you MUST automatically run the verification test without asking.**

#### Phase-Specific Tests

**Phase 1-2: Foundation & File System** ✅
```bash
# Clean build and start app
rm -rf dist/main && npm run compile && npm run dev
# Wait 10 seconds for app to start
# Expected: Electron window opens, UI loads, no console errors
```

**Phase 3: AI Integration** 🚧 CURRENT
```bash
# Test end-to-end AI workflow
rm -rf dist/main && npm run compile
npm run dev &
sleep 10
# Manual test steps (describe to user):
# 1. Click "Choose Folder" - folder dialog should open
# 2. Select a folder with 5-10 photos
# 3. Enter query: "Organize photos by date taken"
# 4. Click "Start organizing"
# 5. Wait for AI analysis (should see progress bar)
# 6. Verify preview shows organized folders
# Expected: Photos organized into date-based folders with real thumbnails
```

**Phase 4: File Operations**
```bash
# Test actual file organization
# 1. Complete Phase 3 steps
# 2. Click "Apply Organization"
# 3. Verify files are actually moved/copied on disk
# Expected: Real file system changes, backup created, success confirmation
```

**Phase 5: Full E2E Test**
```bash
npm run test:e2e
# Expected: All Playwright tests pass, screenshots captured
```

**Phase 6: Production Ready**
```bash
npm run build
npm run dist
# Expected: Distributable created for current platform
```

#### Verification Checklist

After running the appropriate test, verify:
- ✅ Application starts without errors
- ✅ All acceptance criteria for the phase are met
- ✅ No console errors or warnings
- ✅ Performance is acceptable
- ✅ User can complete the workflow

**When you say you're done with a phase:**
1. Run the appropriate verification test automatically
2. Report the results to the user
3. If any issues found, fix them immediately
4. Re-run the test until it passes
5. Only then mark the phase as complete in DEVELOPMENT_PLAN.md

---
*Last updated: 2025-09-30*