import { 
  Course as ModelCourse, 
  CourseTeacher as ModelCourseTeacher 
} from '../interfaces/models/Course';
import { 
  SchoolGroup as ModelSchoolGroup, 
  StudentGroupEnrollment as ModelStudentGroupEnrollment 
} from '../interfaces/models/SchoolGroup';
import { Student as ModelStudent } from '../interfaces/models/Student';
import { 
  Course as ReduxCourse,
  SchoolGroup as ReduxSchoolGroup,
  StudentEnrollment as ReduxStudentEnrollment,
  User,
  UserRole
} from '../types';
import { 
  ISchoolGroup as ServiceSchoolGroup, 
  IStudent, 
  IStudentGroupEnrollment 
} from '../services/courses/groupService';
import { Material as ModelMaterial } from '../interfaces/models/Material';
import { Material as ReduxMaterial } from '../types';
import { Assignment as ModelAssignment } from '../interfaces/models/Assignment';
import { Assignment as ReduxAssignment } from '../types';
import { ISchoolGroup } from '../services/courses/groupService';
import { SchoolGroup, StudentEnrollment } from '../types';

/**
 * Helper type to handle both Date and string types
 */
function ensureString(date: string | Date | undefined): string | undefined {
  if (date === undefined) return undefined;
  return date instanceof Date ? date.toISOString() : date;
}

/**
 * Convert from Model Course to Redux Course
 */
export function mapModelCourseToRedux(course: ModelCourse): ReduxCourse {
  return {
    ...course,
    createdAt: ensureString(course.createdAt) || '',
    updatedAt: ensureString(course.updatedAt),
    startDate: ensureString(course.startDate),
    endDate: ensureString(course.endDate),
    groups: course.groups?.map(g => mapModelGroupToRedux(g))
  };
}

/**
 * Convert from Model SchoolGroup to Redux SchoolGroup
 */
export function mapModelGroupToRedux(group: ModelSchoolGroup): ReduxSchoolGroup {
  return {
    ...group,
    createdAt: ensureString(group.createdAt) || '',
    updatedAt: ensureString(group.updatedAt),
    // Map the studentEnrollments to Redux StudentEnrollment format
    studentEnrollments: group.studentEnrollments?.map(e => ({
      id: e.id,
      studentId: e.studentId,
      groupId: e.groupId,
      enrollmentDate: ensureString(e.enrollmentDate) || '',
      status: e.status,
      progress: e.progress,
      student: e.student ? mapModelStudentToUser(e.student) : undefined
    })),
    // Handle any other properties that need special handling
  };
}

/**
 * Convert from Model Student to Redux User
 */
export function mapModelStudentToUser(student: ModelStudent): User {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    role: UserRole.Student,
    token: '', // Add empty token since it's required
    // Map other properties as needed
  };
}

/**
 * Convert Model Course array to Redux Course array
 */
export function mapModelCoursesToRedux(courses: ModelCourse[]): ReduxCourse[] {
  return courses.map(course => mapModelCourseToRedux(course));
}

/**
 * Convert Model SchoolGroup array to Redux SchoolGroup array
 */
export function mapModelGroupsToRedux(groups: ModelSchoolGroup[]): ReduxSchoolGroup[] {
  return groups.map(group => mapModelGroupToRedux(group));
}

/**
 * Maps ISchoolGroup interface model to Redux SchoolGroup model
 */
export const mapLegacyGroupToRedux = (group: ServiceSchoolGroup): ReduxSchoolGroup => {
  return {
    ...group,
    createdAt: group.createdAt || new Date().toISOString(),
    id: group.id || '',
    name: group.name || '',
    description: group.description || '',
    students: group.students || []
  };
};

/**
 * Maps array of ISchoolGroup interface models to Redux SchoolGroup models
 */
export const mapLegacyGroupsToRedux = (groups: ServiceSchoolGroup[]): ReduxSchoolGroup[] => {
  return groups.map(mapLegacyGroupToRedux);
};

/**
 * Maps IMaterial interface model to Redux Material model
 */
export const mapLegacyMaterialToRedux = (material: ModelMaterial): ReduxMaterial => {
  return {
    ...material,
    id: material.id || '',
    title: material.title || '',
    content: material.content || '',
    courseId: material.courseId || '',
    createdById: material.createdById || '',
    createdAt: ensureString(material.createdAt) || '',
    updatedAt: ensureString(material.updatedAt) || ''
  };
};

/**
 * Maps array of IMaterial interface models to Redux Material models
 */
export const mapLegacyMaterialsToRedux = (materials: ModelMaterial[]): ReduxMaterial[] => {
  return materials.map(mapLegacyMaterialToRedux);
};

/**
 * Maps IAssignment interface model to Redux Assignment model
 */
export const mapToReduxAssignment = (assignment: ModelAssignment): ReduxAssignment => {
  return {
    ...assignment,
    id: assignment.id || '',
    title: assignment.title || '',
    description: assignment.description || '',
    dueDate: ensureString(assignment.dueDate) || '',
    courseId: assignment.courseId || '',
    createdAt: ensureString(assignment.createdAt),
    updatedAt: ensureString(assignment.updatedAt)
  };
};

/**
 * Maps array of IAssignment interface models to Redux Assignment models
 */
export const mapToReduxAssignments = (assignments: ModelAssignment[]): ReduxAssignment[] => {
  return assignments.map(mapToReduxAssignment);
};

/**
 * Maps ICourse interface model to Redux Course model
 */
export const mapLegacyCourseToRedux = (course: ModelCourse): ReduxCourse => {
  return {
    ...course,
    id: course.id || '',
    name: course.name || '',
    description: course.description || '',
    startDate: ensureString(course.startDate),
    endDate: ensureString(course.endDate),
    createdAt: ensureString(course.createdAt) || '',
    updatedAt: ensureString(course.updatedAt),
    // For groups property, ensure they are mapped correctly
    groups: course.groups?.map(group => mapModelGroupToRedux(group))
  };
};

/**
 * Maps array of ICourse interface models to Redux Course models
 */
export const mapLegacyCoursesToRedux = (courses: ModelCourse[]): ReduxCourse[] => {
  return courses.map(mapLegacyCourseToRedux);
};

/**
 * Convert from legacy ISchoolGroup to Model SchoolGroup
 */
export function mapLegacyGroupToModel(group: ServiceSchoolGroup): ModelSchoolGroup {
  return {
    ...group,
    // Handle required fields that might be undefined in legacy type
    createdAt: group.createdAt || new Date().toISOString(),
    // Map other properties as needed
    students: group.students?.map(student => mapLegacyStudentToModel(student)),
    studentEnrollments: group.studentEnrollments?.map(enrollment => {
      if (typeof enrollment !== 'object') return undefined;
      return mapLegacyEnrollmentToModel(enrollment as IStudentGroupEnrollment);
    }).filter(Boolean) as ModelStudentGroupEnrollment[]
  };
}

/**
 * Convert legacy ISchoolGroup array to Model SchoolGroup array
 */
export function mapLegacyGroupsToModel(groups: ServiceSchoolGroup[]): ModelSchoolGroup[] {
  return groups.map(group => mapLegacyGroupToModel(group));
}

/**
 * Convert from legacy IStudentGroupEnrollment to Model StudentGroupEnrollment
 */
export function mapLegacyEnrollmentToModel(enrollment: IStudentGroupEnrollment): ModelStudentGroupEnrollment {
  return {
    id: enrollment.id,
    groupId: enrollment.groupId,
    studentId: enrollment.studentId,
    enrollmentDate: enrollment.enrollmentDate,
    status: enrollment.status,
    progress: 0, // Add default progress value
    student: enrollment.student ? mapLegacyStudentToModel(enrollment.student) : undefined,
    group: enrollment.group ? mapLegacyGroupToModel(enrollment.group) : undefined,
  };
}

/**
 * Convert from legacy IStudent to Model Student
 */
export function mapLegacyStudentToModel(student: IStudent): ModelStudent {
  return {
    id: student.id,
    firstName: student.firstName || student.name?.split(' ')[0] || '',
    lastName: student.lastName || student.name?.split(' ').slice(1).join(' ') || '',
    email: student.email || '',
    // Map other properties as needed
  };
}

/**
 * Maps ISchoolGroup to SchoolGroup for Redux storage
 */
export const mapISchoolGroupToSchoolGroup = (group: ISchoolGroup): SchoolGroup => {
  return {
    ...group,
    createdAt: group.createdAt || new Date().toISOString(),
    updatedAt: group.updatedAt,
    studentEnrollments: group.studentEnrollments?.map(enrollment => {
      if (typeof enrollment !== 'object') return undefined;
      return {
        id: enrollment.id,
        studentId: enrollment.studentId,
        groupId: enrollment.groupId,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        progress: 0, // Default progress value
        student: enrollment.student ? {
          id: enrollment.student.id,
          name: enrollment.student.name || `${enrollment.student.firstName || ''} ${enrollment.student.lastName || ''}`.trim(),
          email: enrollment.student.email || '',
          role: enrollment.student.role || 'Student'
        } : undefined
      } as StudentEnrollment;
    }).filter(Boolean) as StudentEnrollment[]
  };
};

/**
 * Maps ISchoolGroup[] to SchoolGroup[] for Redux storage
 */
export const mapISchoolGroupsToSchoolGroups = (groups: ISchoolGroup[]): SchoolGroup[] => {
  return groups.map(mapISchoolGroupToSchoolGroup);
}; 