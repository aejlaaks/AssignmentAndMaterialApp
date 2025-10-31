import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Course, Material, Assignment, SchoolGroup } from '../../types';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  materials: Material[];
  assignments: Assignment[];
  schoolGroups: SchoolGroup[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  materials: [],
  assignments: [],
  schoolGroups: [],
  isLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    // Course actions
    fetchCoursesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCoursesSuccess: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
      state.isLoading = false;
    },
    fetchCoursesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCurrentCourse: (state, action: PayloadAction<Course>) => {
      state.currentCourse = action.payload;
    },
    addCourse: (state, action: PayloadAction<Course>) => {
      state.courses.push(action.payload);
    },
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
        if (state.currentCourse?.id === action.payload.id) {
          state.currentCourse = action.payload;
        }
      }
    },
    deleteCourse: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(c => c.id !== action.payload);
      if (state.currentCourse?.id === action.payload) {
        state.currentCourse = null;
      }
    },

    // Material actions
    fetchMaterialsSuccess: (state, action: PayloadAction<Material[]>) => {
      state.materials = action.payload;
    },
    addMaterial: (state, action: PayloadAction<Material>) => {
      state.materials.push(action.payload);
    },
    updateMaterial: (state, action: PayloadAction<Material>) => {
      const index = state.materials.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.materials[index] = action.payload;
      }
    },
    deleteMaterial: (state, action: PayloadAction<string>) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
    },

    // Assignment actions
    fetchAssignmentsSuccess: (state, action: PayloadAction<Assignment[]>) => {
      state.assignments = action.payload;
    },
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      state.assignments.push(action.payload);
    },
    updateAssignment: (state, action: PayloadAction<Assignment>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.assignments[index] = action.payload;
      }
    },
    deleteAssignment: (state, action: PayloadAction<string>) => {
      state.assignments = state.assignments.filter(a => a.id !== action.payload);
    },

    // School Group actions
    fetchSchoolGroupsSuccess: (state, action: PayloadAction<SchoolGroup[]>) => {
      state.schoolGroups = action.payload;
    },
    addSchoolGroup: (state, action: PayloadAction<SchoolGroup>) => {
      state.schoolGroups.push(action.payload);
    },
    updateSchoolGroup: (state, action: PayloadAction<SchoolGroup>) => {
      const index = state.schoolGroups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.schoolGroups[index] = action.payload;
      }
    },
    deleteSchoolGroup: (state, action: PayloadAction<string>) => {
      state.schoolGroups = state.schoolGroups.filter(g => g.id !== action.payload);
    },
  },
});

export const {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  setCurrentCourse,
  addCourse,
  updateCourse,
  deleteCourse,
  fetchMaterialsSuccess,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  fetchAssignmentsSuccess,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  fetchSchoolGroupsSuccess,
  addSchoolGroup,
  updateSchoolGroup,
  deleteSchoolGroup,
} = courseSlice.actions;

export default courseSlice.reducer;
