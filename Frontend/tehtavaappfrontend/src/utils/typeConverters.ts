import { SchoolGroup, StudentGroupEnrollment } from '../interfaces/models/SchoolGroup';
import { Student } from '../interfaces/models/Student';
import { 
  ISchoolGroup, 
  IStudent, 
  IStudentGroupEnrollment 
} from '../services/courses/groupService';
import { StudentEnrollment } from '../types';

/**
 * Converts a legacy ISchoolGroup to the new SchoolGroup interface
 */
export const mapToSchoolGroup = (group: ISchoolGroup): SchoolGroup => {
  return {
    ...group,
    // Convert optional createdAt to required createdAt, defaulting to current date if undefined
    createdAt: group.createdAt || new Date().toISOString(),
    // Map students if they exist
    students: group.students?.map(student => mapToStudent(student)),
    // Map studentEnrollments if they exist
    studentEnrollments: group.studentEnrollments?.map(enrollment => 
      typeof enrollment === 'object' ? mapToStudentGroupEnrollment(enrollment) : undefined
    ).filter(Boolean) as StudentGroupEnrollment[],
  };
};

/**
 * Converts an array of legacy ISchoolGroup to the new SchoolGroup interface
 */
export const mapToSchoolGroups = (groups: ISchoolGroup[]): SchoolGroup[] => {
  return groups.map(group => mapToSchoolGroup(group));
};

/**
 * Converts a legacy IStudent to the new Student interface
 */
export const mapToStudent = (student: IStudent): Student => {
  return {
    id: student.id,
    firstName: student.firstName || student.name?.split(' ')[0] || '',
    lastName: student.lastName || student.name?.split(' ').slice(1).join(' ') || '',
    email: student.email || '',
    // Map other properties as needed
  };
};

/**
 * Converts a legacy IStudentGroupEnrollment to the new StudentGroupEnrollment interface
 */
export const mapToStudentGroupEnrollment = (enrollment: IStudentGroupEnrollment): StudentGroupEnrollment => {
  return {
    id: enrollment.id,
    groupId: enrollment.groupId,
    studentId: enrollment.studentId,
    enrollmentDate: enrollment.enrollmentDate,
    status: enrollment.status,
    progress: 0, // Add default progress value
    student: enrollment.student ? mapToStudent(enrollment.student) : undefined,
    group: enrollment.group ? mapToSchoolGroup(enrollment.group) : undefined,
  };
};

/**
 * Converts the new SchoolGroup type to the legacy ISchoolGroup interface
 * This is used when passing data to legacy API functions
 */
export const mapToISchoolGroup = (group: SchoolGroup): ISchoolGroup => {
  return {
    ...group,
    createdAt: typeof group.createdAt === 'string' ? group.createdAt : group.createdAt.toISOString(),
    updatedAt: group.updatedAt ? (typeof group.updatedAt === 'string' ? group.updatedAt : group.updatedAt.toISOString()) : undefined,
    students: group.students?.map(student => mapToIStudent(student)),
    // Handle studentEnrollments mapping
  };
};

/**
 * Converts the new Student type to the legacy IStudent interface
 */
export const mapToIStudent = (student: Student): IStudent => {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    name: `${student.firstName} ${student.lastName}`.trim(),
  };
};

/**
 * Converts between StudentEnrollment and StudentGroupEnrollment
 */
export const mapEnrollmentTypes = (enrollment: StudentEnrollment): StudentGroupEnrollment => {
  return {
    id: enrollment.id,
    groupId: enrollment.groupId,
    studentId: enrollment.studentId,
    enrollmentDate: enrollment.enrollmentDate,
    status: enrollment.status,
    progress: enrollment.progress,
    // Map other properties as needed
  };
}; 