import axios from 'axios';
import { authService } from '../auth/authService';
import { User, UserRole } from '../../types';
import { getUsersByRole } from '../users/userService';
import { API_URL } from '../../utils/apiConfig';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export interface ISchoolGroup {
  id: string;
  name: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
  isActive?: boolean;
  memberCount?: number;
  studentCount?: number;
  courseCount?: number;
  courseId?: string;
  students?: IStudent[];
  studentEnrollments?: any[];
  hasCourse?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateGroupRequest {
  name: string;
  description: string;
  memberIds?: string[];
  courseIds?: string[];
  metadata?: Record<string, string>;
}

export interface IStudent {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  role?: UserRole;
}

export interface IStudentGroupEnrollment {
  id: string;
  groupId: string;
  studentId: string;
  enrollmentDate: string;
  status: string;
  student?: IStudent;
  group?: ISchoolGroup;
}

export const groupService = {
  async getGroups(): Promise<ISchoolGroup[]> {
    try {
      // GroupController.cs: [HttpGet]
      const response = await api.get('/group');
      const data = response.data;
      
      // Handle the new JSON format with ReferenceHandler.Preserve
      let groups = [];
      if (data && data.$values) {
        console.log('Groups data with $values:', data.$values);
        groups = data.$values || [];
      } else if (Array.isArray(data)) {
        // Jos data on jo taulukko
        groups = data;
      } else {
      // If data is an empty array or not in the expected format, return an empty array
        console.log('Groups data not in expected format:', data);
        return [];
      }
      
      // Käsitellään jokainen ryhmä ja varmistetaan, että students-kenttä on olemassa
      const processedGroups = groups.map((group: ISchoolGroup) => {
        // Jos ryhmällä on studentEnrollments-kenttä, mutta ei students-kenttää tai students on tyhjä
        if (group.studentEnrollments && Array.isArray(group.studentEnrollments) && 
            (!group.students || group.students.length === 0)) {
          // Luodaan students-kenttä studentEnrollments-kentästä
          const students = group.studentEnrollments
            .filter((enrollment: any) => enrollment.student)
            .map((enrollment: any) => ({
              id: enrollment.studentId,
              firstName: enrollment.student?.firstName,
              lastName: enrollment.student?.lastName,
              email: enrollment.student?.email,
              role: enrollment.student?.role,
              enrollmentDate: enrollment.enrollmentDate,
              enrollmentStatus: enrollment.status
            }));
          
          // Lisätään students-kenttä ryhmän tietoihin
          return {
            ...group,
            students: students,
            studentCount: students.length
          };
        }
        
        // Jos ryhmällä ei ole students-kenttää, luodaan tyhjä taulukko
        if (!group.students) {
          return {
            ...group,
            students: [],
            studentCount: 0
          };
        }
        
        // Jos ryhmällä on students-kenttä, lisätään studentCount-kenttä
        return {
          ...group,
          studentCount: group.students.length
        };
      });
      
      console.log('Processed groups data:', processedGroups);
      return processedGroups;
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      
      // Tarkistetaan virhekoodi
      if (error?.response?.status === 403) {
        console.error('Ei oikeuksia nähdä ryhmiä');
      }
      
      return []; // Return empty array instead of throwing
    }
  },

  async getGroupsByCourse(courseId: string): Promise<ISchoolGroup[]> {
    try {
      console.log(`Haetaan kurssin ${courseId} ryhmät...`);
      
      // Varmistetaan, että courseId on kelvollinen
      if (!courseId) {
        console.error('Virheellinen kurssin ID:', courseId);
        return [];
      }
      
      const sanitizedCourseId = typeof courseId === 'string' ? courseId.trim() : courseId;
      const numericCourseId = parseInt(String(sanitizedCourseId), 10);
      
      if (isNaN(numericCourseId)) {
        console.error('Virheellinen numeerinen kurssin ID:', { sanitizedCourseId, numericCourseId });
        return [];
      }
      
      console.log(`Numeerinen kurssin ID: ${numericCourseId}`);
      
      // Use a direct endpoint for groups by course
      console.log(`API-kutsu: GET /course/${numericCourseId}/groups`);
      const response = await api.get(`/course/${numericCourseId}/groups`);
      console.log('API vastaus:', response);
      
      let data = response.data;
      console.log('Raaka data:', data);
      
      // Handle the new JSON format with ReferenceHandler.Preserve
      let groups = data && data.$values ? data.$values : data;
      
      console.log('Ryhmät kurssilta, raakadata:', groups);
      
      // If groups is not an array or is undefined, return an empty array
      if (!groups) {
        console.error('Ryhmät eivät ole odotetussa muodossa (undefined):', groups);
        return [];
      }
      
      if (!Array.isArray(groups)) {
        console.error('Ryhmät eivät ole odotetussa muodossa (ei taulukko):', groups);
        try {
          // Yritetään muuntaa taulukoksi, jos mahdollista
          if (typeof groups === 'object') {
            const values = Object.values(groups);
            if (values.length > 0) {
              console.log('Muunnettu objekti taulukoksi:', values);
              groups = values;
            } else {
              return [];
            }
          } else {
            return [];
          }
        } catch (error) {
          console.error('Virhe muunnettaessa ryhmädataa:', error);
          return [];
        }
      }
      
      // Haetaan kurssin opiskelijat erikseen
      const courseStudents = await this.getCourseStudentIds(numericCourseId);
      console.log(`Kurssin ${numericCourseId} opiskelijat haettu:`, courseStudents);
      
      // Käsitellään jokainen ryhmä ja varmistetaan, että students-kenttä on olemassa
      const processedGroups = groups.map((group: any) => {
        console.log(`Käsitellään ryhmä:`, group);
        
        // Varmistetaan, että ryhmällä on id
        if (!group || !group.id) {
          console.error('Ryhmällä ei ole id-kenttää:', group);
          return null;
        }
        
        // Varmistetaan, että ryhmällä on studentEnrollments-kenttä
        if (!group.studentEnrollments || !Array.isArray(group.studentEnrollments)) {
          console.log(`Ryhmällä ${group.id} ei ole studentEnrollments-kenttää, luodaan tyhjä taulukko`);
          group.studentEnrollments = [];
        }
        
        // Luodaan students-kenttä studentEnrollments-kentästä
        const students = group.studentEnrollments
          .filter((enrollment: any) => enrollment && enrollment.student)
          .map((enrollment: any) => {
            try {
              // Tarkistetaan, onko opiskelija ilmoittautunut kurssille
              const isEnrolledToCourse = courseStudents.includes(enrollment.studentId);
              
              return {
                id: enrollment.studentId,
                firstName: enrollment.student?.firstName || '',
                lastName: enrollment.student?.lastName || '',
                email: enrollment.student?.email || '',
                role: enrollment.student?.role || '',
                enrollmentDate: enrollment.enrolledAt || enrollment.enrollmentDate,
                enrollmentStatus: enrollment.status,
                enrolledToCourse: isEnrolledToCourse
              };
            } catch (error) {
              console.error('Virhe käsiteltäessä opiskelijan ilmoittautumista:', error, enrollment);
              return null;
            }
          })
          .filter((student: any) => student !== null);
        
        console.log(`Ryhmälle ${group.id} luotu ${students.length} opiskelijaa`);
        
        // Tarkistetaan, onko ryhmällä Courses-kokoelma ja onko siinä tämä kurssi
        const hasCourse = group.courses && Array.isArray(group.courses) && 
          group.courses.some((c: any) => c && c.id === numericCourseId);
        
        console.log(`Ryhmällä ${group.id} on kurssi ${numericCourseId}: ${hasCourse}`);
        
        // Luodaan uusi ryhmäobjekti, jossa on kaikki tarvittavat kentät
        return {
          id: group.id.toString(),
          name: group.name || 'Nimetön ryhmä',
          description: group.description || '',
          createdById: group.createdById,
          createdByName: group.createdBy ? `${group.createdBy.firstName} ${group.createdBy.lastName}` : '',
          isActive: group.isActive !== false, // oletusarvoisesti aktiivinen
          students: students,
          studentCount: students.length,
          studentEnrollments: group.studentEnrollments,
          courseId: courseId,
          hasCourse: hasCourse,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        };
      })
      .filter((group: any) => group !== null); // Poistetaan null-arvot
      
      console.log('Käsitellyt ryhmät:', processedGroups);
      return processedGroups;
    } catch (error) {
      console.error(`Virhe haettaessa ryhmiä kurssille ${courseId}:`, error);
      return []; // Palautetaan tyhjä taulukko virheen sijaan
    }
  },

  // Apumetodi kurssin opiskelijoiden ID:iden hakemiseen
  async getCourseStudentIds(courseId: number): Promise<string[]> {
    try {
      console.log(`Haetaan kurssin ${courseId} opiskelijat...`);
      
      // Haetaan kurssin tiedot API:sta
      const response = await api.get(`/course/${courseId}`);
      console.log(`Kurssin ${courseId} tiedot saatu:`, response.data);
      
      // Tarkistetaan, että vastaus sisältää opiskelijat
      if (response.data && response.data.students && Array.isArray(response.data.students)) {
        const studentIds = response.data.students.map((student: any) => student.id);
        console.log(`Kurssilla ${courseId} on ${studentIds.length} opiskelijaa:`, studentIds);
        return studentIds;
      }
      
      console.log(`Kurssilla ${courseId} ei ole opiskelijoita`);
      return [];
    } catch (error) {
      console.error(`Virhe haettaessa kurssin ${courseId} opiskelijoita:`, error);
      return [];
    }
  },

  async getGroupById(id: string): Promise<ISchoolGroup> {
    try {
      // Tarkistetaan, että ID on kelvollinen
      if (!id || typeof id !== 'string') {
        console.error('Virheellinen ryhmän ID:', id);
        throw new Error('Virheellinen ryhmän ID');
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:stä
      const sanitizedId = id.trim();
      
      if (!sanitizedId) {
        console.error('Tyhjä ryhmän ID');
        throw new Error('Tyhjä ryhmän ID');
      }
      
      // Tarkistetaan, ettei ID ole "create"
      if (sanitizedId === 'create') {
        console.error('Virheellinen ryhmän ID: create');
        throw new Error('Virheellinen ryhmän ID');
      }
      
      console.log(`Haetaan ryhmän ${sanitizedId} tiedot API:sta`);
      
      try {
        // Käytetään oikeaa endpointia ryhmän tietojen hakemiseen
        // GroupController.cs: [HttpGet("{id}")]
        const response = await api.get(`/group/${sanitizedId}`);
        console.log(`Ryhmän ${sanitizedId} tiedot saatu:`, response.data);
        
        // Muunnetaan vastaus sopivaan muotoon
        const groupData = response.data;
        
        // Tarkistetaan, onko ryhmällä kursseja
        if (groupData && groupData.courses && Array.isArray(groupData.courses) && groupData.courses.length > 0) {
          console.log(`Ryhmällä ${sanitizedId} on ${groupData.courses.length} kurssia:`, 
            groupData.courses.map((c: any) => `${c.name} (${c.id})`));
          groupData.hasCourse = true;
          groupData.courseCount = groupData.courses.length;
        } else {
          console.log(`Ryhmällä ${sanitizedId} ei ole kursseja`);
          groupData.hasCourse = false;
          groupData.courseCount = 0;
        }
        
        // Tarkistetaan, onko studentEnrollments-kenttä ja muunnetaan se students-kentäksi
        if (groupData && groupData.studentEnrollments && Array.isArray(groupData.studentEnrollments)) {
          console.log(`Ryhmässä ${sanitizedId} on ${groupData.studentEnrollments.length} ilmoittautumista`);
          
          // Muunnetaan studentEnrollments students-kentäksi
          const students = groupData.studentEnrollments
            .filter((enrollment: any) => enrollment.student) // Varmistetaan, että student-objekti on olemassa
            .map((enrollment: any) => ({
              id: enrollment.studentId,
              firstName: enrollment.student?.firstName,
              lastName: enrollment.student?.lastName,
              email: enrollment.student?.email,
              role: enrollment.student?.role,
              enrollmentDate: enrollment.enrollmentDate,
              enrollmentStatus: enrollment.status
            }));
          
          // Lisätään students-kenttä ryhmän tietoihin
          groupData.students = students;
          
          // Lisätään studentCount-kenttä
          groupData.studentCount = students.length;
          
          console.log(`Ryhmässä ${sanitizedId} on ${students.length} opiskelijaa:`, 
            students.map((s: IStudent) => `${s.firstName} ${s.lastName} (${s.id})`));
        } else {
          console.log(`Ryhmässä ${sanitizedId} ei ole ilmoittautumisia tai studentEnrollments-kenttä puuttuu`);
          // Varmistetaan, että students-kenttä on aina olemassa
          groupData.students = [];
          // Lisätään studentCount-kenttä
          groupData.studentCount = 0;
        }
        
        return groupData;
      } catch (error: any) {
        console.error(`Error fetching group ${sanitizedId}:`, error);
        
        // Tarkistetaan virhekoodi
        if (error?.response?.status === 400) {
          console.error(`Bad Request virhe haettaessa ryhmää ${sanitizedId}:`, error.response?.data);
          throw new Error(`Virheellinen pyyntö: ${error.response?.data?.message || 'Tuntematon virhe'}`);
        } else if (error?.response?.status === 404) {
          console.error(`Ryhmää ${sanitizedId} ei löytynyt`);
          throw new Error('Ryhmää ei löytynyt');
        } else if (error?.response?.status === 403) {
          console.error(`Ei oikeuksia ryhmän ${sanitizedId} tietojen katseluun`);
          throw new Error('Ei oikeuksia ryhmän tietojen katseluun');
        }
        
        throw error;
      }
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      throw error;
    }
  },

  async createGroup(groupData: ICreateGroupRequest): Promise<ISchoolGroup> {
    try {
      // JWT token will be automatically included in the request headers
      // and the backend will extract the user ID from it
      
      // Lähetetään ryhmän perustiedot
      // GroupController.cs: [HttpPost]
      const requestData = {
        name: groupData.name,
        description: groupData.description || `Group for ${groupData.name}`
      };
      
      console.log('Creating group with data:', requestData);
      
      const response = await api.post('/group', requestData);
      console.log('Group created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      // Tarkistetaan virhekoodi
      if (error?.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Virheellinen pyyntö';
        console.error(`Bad Request virhe luotaessa ryhmää:`, errorMessage);
        throw new Error(`Virheellinen pyyntö: ${errorMessage}`);
      } else if (error?.response?.status === 403) {
        throw new Error('Ei oikeuksia luoda ryhmää');
      }
      
      throw error;
    }
  },

  async addCourseToGroup(groupId: string, courseId: string): Promise<{ success: boolean, enrolledStudents?: any[], error?: string }> {
    try {
      // Tarkistetaan, että groupId ja courseId ovat kelvollisia
      if (!groupId || typeof groupId !== 'string') {
        console.error('Virheellinen ryhmän ID:', groupId);
        throw new Error('Virheellinen ryhmän ID');
      }
      
      if (!courseId || typeof courseId !== 'string') {
        console.error('Virheellinen kurssin ID:', courseId);
        throw new Error('Virheellinen kurssin ID');
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:istä
      const sanitizedGroupId = groupId.trim();
      const sanitizedCourseId = courseId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Tyhjä ryhmän ID');
        throw new Error('Tyhjä ryhmän ID');
      }
      
      if (!sanitizedCourseId) {
        console.error('Tyhjä kurssin ID');
        throw new Error('Tyhjä kurssin ID');
      }
      
      console.log(`Lisätään kurssi ${sanitizedCourseId} ryhmälle ${sanitizedGroupId}`);
      
      // Lähetetään pyyntö API:lle
      // GroupController.cs: [HttpPost("{id}/courses/{courseId}")]
      try {
        const response = await api.post(`/group/${sanitizedGroupId}/courses/${sanitizedCourseId}`);
        console.log(`Kurssi ${sanitizedCourseId} lisätty ryhmälle ${sanitizedGroupId}:`, response.data);
      } catch (error: any) {
        // If we get a 400 error, it might be that the course is already linked to the group
        if (error.response && error.response.status === 400) {
          console.warn(`Kurssi ${sanitizedCourseId} saattaa olla jo lisätty ryhmälle ${sanitizedGroupId}:`, error.response.data);
          // Continue anyway to enroll students
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
      
      // Odotetaan hetki, jotta backend ehtii käsitellä muutoksen
      console.log('Odotetaan 500ms ennen ryhmän tietojen hakemista...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Haetaan ryhmän tiedot, jotta saadaan opiskelijat
      console.log(`Haetaan ryhmän ${sanitizedGroupId} tiedot...`);
      const group = await this.getGroupById(sanitizedGroupId);
      console.log(`Ryhmän ${sanitizedGroupId} tiedot haettu:`, group);
      
      if (!group || !group.students || !Array.isArray(group.students)) {
        console.error(`Ryhmän ${sanitizedGroupId} tiedot eivät ole odotetussa muodossa:`, group);
        return { success: true, enrolledStudents: [] };
      }
      
      // Ilmoitetaan ryhmän opiskelijat kurssille
      console.log(`Ilmoitetaan ${group.students.length} opiskelijaa kurssille ${sanitizedCourseId}...`);
      
      const enrolledStudents = [];
      
      for (const student of group.students) {
        try {
          console.log(`Ilmoitetaan opiskelija ${student.id} (${student.firstName} ${student.lastName}) kurssille ${sanitizedCourseId}...`);
          
          // Tarkistetaan, että opiskelijan ID on kelvollinen
          if (!student.id) {
            console.error('Virheellinen opiskelijan ID:', student);
            continue;
          }
          
          // Ilmoitetaan opiskelija kurssille
          // CourseController.cs: [HttpPost("{id}/enroll/{studentId}")]
          const enrollResponse = await api.post(`/course/${sanitizedCourseId}/enroll/${student.id}`);
          console.log(`Opiskelija ${student.id} ilmoitettu kurssille ${sanitizedCourseId}:`, enrollResponse.data);
          
          enrolledStudents.push({
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email
          });
        } catch (error) {
          console.error(`Virhe ilmoitettaessa opiskelijaa ${student.id} kurssille ${sanitizedCourseId}:`, error);
          // Jatketaan seuraavaan opiskelijaan
        }
      }
      
      console.log(`${enrolledStudents.length}/${group.students.length} opiskelijaa ilmoitettu kurssille ${sanitizedCourseId}`);
      
      return {
        success: true,
        enrolledStudents
      };
    } catch (error: any) {
      console.error('Error adding course to group:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async removeCourseFromGroup(groupId: string, courseId: string): Promise<{ success: boolean, error?: string }> {
    try {
      // Tarkistetaan, että groupId ja courseId ovat kelvollisia
      if (!groupId || typeof groupId !== 'string') {
        console.error('Virheellinen ryhmän ID:', groupId);
        throw new Error('Virheellinen ryhmän ID');
      }
      
      if (!courseId || typeof courseId !== 'string') {
        console.error('Virheellinen kurssin ID:', courseId);
        throw new Error('Virheellinen kurssin ID');
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:istä
      const sanitizedGroupId = groupId.trim();
      const sanitizedCourseId = courseId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Tyhjä ryhmän ID');
        throw new Error('Tyhjä ryhmän ID');
      }
      
      if (!sanitizedCourseId) {
        console.error('Tyhjä kurssin ID');
        throw new Error('Tyhjä kurssin ID');
      }
      
      console.log(`Poistetaan kurssi ${sanitizedCourseId} ryhmältä ${sanitizedGroupId}`);
      
      // Lähetetään DELETE-pyyntö API:lle
      // GroupController.cs: [HttpDelete("{id}/courses/{courseId}")]
      try {
        const response = await api.delete(`/group/${sanitizedGroupId}/courses/${sanitizedCourseId}`);
        console.log(`Kurssi ${sanitizedCourseId} poistettu ryhmältä ${sanitizedGroupId}:`, response.data);
        return { success: true };
      } catch (error: any) {
        // Handle different error cases
        if (error.response) {
          if (error.response.status === 404) {
            console.error(`Ryhmää ${sanitizedGroupId} tai kurssia ${sanitizedCourseId} ei löydy:`, error.response.data);
            throw new Error(`Ryhmää tai kurssia ei löydy: ${error.response.data}`);
          } else if (error.response.status === 403) {
            console.error(`Ei oikeuksia poistaa kurssia ${sanitizedCourseId} ryhmältä ${sanitizedGroupId}:`, error.response.data);
            throw new Error(`Ei oikeuksia poistaa kurssia ryhmältä: ${error.response.data}`);
          } else if (error.response.status === 400) {
            const errorMessage = error.response.data || 'Virheellinen pyyntö';
            console.error(`Virhe poistettaessa kurssia ${sanitizedCourseId} ryhmältä ${sanitizedGroupId}:`, errorMessage);
            throw new Error(`Virhe poistettaessa kurssia ryhmältä: ${errorMessage}`);
          }
        }
        
        console.error(`Tuntematon virhe poistettaessa kurssia ${sanitizedCourseId} ryhmältä ${sanitizedGroupId}:`, error);
        throw new Error(`Tuntematon virhe poistettaessa kurssia ryhmältä: ${error.message || error}`);
      }
    } catch (error: any) {
      console.error('Virhe poistettaessa kurssia ryhmältä:', error);
      return { success: false, error: error.message || 'Tuntematon virhe' };
    }
  },
  
  // Uusi metodi opiskelijan ilmoittamiseksi kurssille
  async enrollStudentToCourse(studentId: string, courseId: string): Promise<boolean> {
    try {
      // Tarkistetaan, että ID:t ovat kelvollisia
      if (!courseId || typeof courseId !== 'string' || !courseId.trim()) {
        console.error('Virheellinen kurssin ID:', courseId);
        return false;
      }
      
      if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
        console.error('Virheellinen opiskelijan ID:', studentId);
        return false;
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:istä
      const sanitizedCourseId = courseId.trim();
      const sanitizedStudentId = studentId.trim();
      
      const response = await api.post(`/courses/${sanitizedCourseId}/students/${sanitizedStudentId}`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error enrolling student ${studentId} to course ${courseId}:`, error);
      return false;
    }
  },
  
  async addStudentToGroup(groupId: string, studentId: string): Promise<boolean | { success: false, error: string }> {
    try {
      if (!groupId || !studentId) {
        console.error('Invalid groupId or studentId provided for addStudentToGroup:', { groupId, studentId });
        return { success: false, error: 'Invalid group or student ID' };
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:istä
      const sanitizedGroupId = groupId.trim();
      const sanitizedStudentId = studentId.trim();
      
      console.log(`Adding student ${sanitizedStudentId} to group ${sanitizedGroupId}`);
      
      const response = await api.post(`/group/${sanitizedGroupId}/students/${sanitizedStudentId}`);
      
      // Log complete response details for debugging
      console.log('Add student response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // Status codes: 200 OK, 201 Created, 204 No Content are all considered successful
      const isSuccess = response.status >= 200 && response.status < 300;
      
      if (isSuccess) {
        console.log(`Successfully added student ${sanitizedStudentId} to group ${sanitizedGroupId} with status ${response.status}`);
        return true;
      } else {
        console.error(`Failed to add student, unexpected status: ${response.status}`);
        return { success: false, error: `Unexpected status code: ${response.status}` };
      }
    } catch (error: any) {
      console.error(`Error adding student ${studentId} to group ${groupId}:`, error);
      
      // More detailed error info
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Add specific handling for 403 forbidden status
        if (error.response.status === 403) {
          return { 
            success: false, 
            error: 'You do not have permission to add students to this group. Only the group creator or admin can perform this action.' 
          };
        }
        
        return { success: false, error: `Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}` };
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        return { success: false, error: 'No response received from server' };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        return { success: false, error: error.message || 'Failed to add student to group' };
      }
    }
  },

  async removeStudentFromGroup(groupId: string, studentId: string): Promise<boolean | { success: false, error: string }> {
    try {
      if (!groupId || !studentId) {
        console.error('Invalid groupId or studentId provided for removeStudentFromGroup:', { groupId, studentId });
        return { success: false, error: 'Invalid group or student ID' };
      }
      
      // Poistetaan mahdolliset erikoismerkit ID:istä
      const sanitizedGroupId = groupId.trim();
      const sanitizedStudentId = studentId.trim();
      
      console.log(`Removing student ${sanitizedStudentId} from group ${sanitizedGroupId}`);
      
      const response = await api.delete(`/group/${sanitizedGroupId}/students/${sanitizedStudentId}`);
      
      console.log(`Successfully removed student ${sanitizedStudentId} from group ${sanitizedGroupId}`);
      
      return true;
    } catch (error: any) {
      console.error(`Error removing student ${studentId} from group ${groupId}:`, error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Add specific handling for 403 forbidden status
        if (error.response.status === 403) {
          return { 
            success: false, 
            error: 'You do not have permission to remove students from this group. Only the group creator or admin can perform this action.' 
          };
        }
        
        return { success: false, error: `Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}` };
      } else if (error.request) {
        return { success: false, error: 'No response received from server' };
      } else {
        return { success: false, error: error.message || 'Failed to remove student from group' };
      }
    }
  },
  
  async getGroupEnrollments(groupId: string): Promise<IStudentGroupEnrollment[]> {
    try {
      // Validate the group ID
      if (!groupId || typeof groupId !== 'string' || !groupId.trim()) {
        console.error('Invalid group ID:', groupId);
        return [];
      }
      
      const sanitizedGroupId = groupId.trim();
      console.log(`Fetching enrollments for group ${sanitizedGroupId}`);
      
      // Get enrollments from the correct endpoint
      const response = await api.get(`/group/${sanitizedGroupId}/enrollments`);
      
      // Handle different response formats - could be an array or an object with values
      let enrollments: IStudentGroupEnrollment[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          enrollments = response.data;
        } else if (response.data.$values && Array.isArray(response.data.$values)) {
          enrollments = response.data.$values;
        }
      }
      
      console.log(`Retrieved ${enrollments.length} enrollments for group ${sanitizedGroupId}`);
      return enrollments;
    } catch (error) {
      console.error(`Error fetching enrollments for group ${groupId}:`, error);
      return [];
    }
  },

  async getStudentEnrollment(groupId: string, studentId: string): Promise<IStudentGroupEnrollment | null> {
    try {
      // Validate IDs
      if (!groupId || typeof groupId !== 'string' || !groupId.trim()) {
        console.error('Invalid group ID:', groupId);
        return null;
      }
      
      if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
        console.error('Invalid student ID:', studentId);
        return null;
      }
      
      const sanitizedGroupId = groupId.trim();
      const sanitizedStudentId = studentId.trim();
      
      console.log(`Fetching enrollment for student ${sanitizedStudentId} in group ${sanitizedGroupId}`);
      
      // Get specific student enrollment from the correct endpoint
      const response = await api.get(`/group/${sanitizedGroupId}/enrollments/${sanitizedStudentId}`);
      
      if (response.data) {
        console.log(`Retrieved enrollment for student ${sanitizedStudentId} in group ${sanitizedGroupId}`, response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching enrollment for student ${studentId} in group ${groupId}:`, error);
      return null;
    }
  },

  // Get group with students - fetches a group by ID and ensures students are loaded
  async getGroupWithStudents(groupId: string): Promise<ISchoolGroup | null> {
    try {
      console.log(`Fetching group ${groupId} with students...`);
      
      // Validate the group ID
      if (!groupId || typeof groupId !== 'string') {
        console.error('Invalid group ID:', groupId);
        return null;
      }
      
      const sanitizedGroupId = groupId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Empty group ID');
        return null;
      }
      
      // Use the existing getGroupById method which already handles students
      const group = await this.getGroupById(sanitizedGroupId);
      
      if (!group) {
        console.error(`Group ${sanitizedGroupId} not found`);
        return null;
      }
      
      // If the group doesn't have students array, create an empty one
      if (!group.students) {
        group.students = [];
      }
      
      console.log(`Group ${sanitizedGroupId} fetched with ${group.students.length} students`);
      return group;
    } catch (error) {
      console.error(`Error fetching group ${groupId} with students:`, error);
      return null;
    }
  },

  // Get available students that can be added to a group
  async getAvailableStudents(groupId: string): Promise<IStudent[]> {
    try {
      console.log(`Fetching available students for group ${groupId}...`);
      
      // Validate the group ID
      if (!groupId || typeof groupId !== 'string') {
        console.error('Invalid group ID:', groupId);
        return [];
      }
      
      const sanitizedGroupId = groupId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Empty group ID');
        return [];
      }
      
      // Use the correct API endpoint to get all students
      // The endpoint is /user/roles/Student based on the backend implementation
      const response = await api.get(`/user/roles/Student`);
      
      console.log(`All students fetched, will filter for group ${sanitizedGroupId}:`, response.data);
      
      // Verify we have data
      if (!response.data) {
        console.error('No student data returned from API');
        return [];
      }
      
      let allStudents = [];
      
      // Handle the response data format - robust check for various formats
      if (response.data && Array.isArray(response.data)) {
        allStudents = response.data;
      } else if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        allStudents = response.data.$values;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract any array property that might contain students
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          // Use the first array found
          allStudents = possibleArrays[0];
        } else {
          console.error(`Unexpected data format for students:`, response.data);
          return [];
        }
      } else {
        console.error(`Unexpected data format for students:`, response.data);
        return [];
      }
      
      console.log(`Found ${allStudents.length} total students to filter`);
      
      // Now we need to fetch current group students to filter them out
      try {
        const groupDetails = await this.getGroupWithStudents(sanitizedGroupId);
        
        if (!groupDetails || !groupDetails.students) {
          console.warn(`Could not get current students for group ${sanitizedGroupId}`);
          return allStudents.map((student: any) => ({
            id: student.id,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            email: student.email || '',
            role: student.role || ''
          }));
        }
        
        // Get IDs of current students in the group
        const currentStudentIds = groupDetails.students.map((s: any) => s.id);
        console.log(`Current student IDs in group ${sanitizedGroupId}:`, currentStudentIds);
        
        // Filter out students already in the group
        const availableStudents = allStudents.filter((student: any) => 
          !currentStudentIds.includes(student.id)
        );
        
        console.log(`Filtered available students for group ${sanitizedGroupId}:`, 
          availableStudents.length, 'out of', allStudents.length);
        
        // Map the students to the expected format
        return availableStudents.map((student: any) => ({
          id: student.id,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          role: student.role || ''
        }));
      } catch (filterError) {
        console.error(`Error filtering students for group ${sanitizedGroupId}:`, filterError);
        
        // Fall back to returning all students if we can't filter
        return allStudents.map((student: any) => ({
          id: student.id,
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          role: student.role || ''
        }));
      }
    } catch (error) {
      console.error(`Error fetching available students for group ${groupId}:`, error);
      return [];
    }
  },
 
  // Update a group's information
  async updateGroup(groupId: string, groupData: { name: string, description: string }): Promise<ISchoolGroup | null> {
    try {
      console.log(`Updating group ${groupId}...`);
      
      // Validate the group ID
      if (!groupId || typeof groupId !== 'string') {
        console.error('Invalid group ID:', groupId);
        return null;
      }
      
      const sanitizedGroupId = groupId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Empty group ID');
        return null;
      }
      
      // Validate the group data
      if (!groupData.name) {
        console.error('Group name is required');
        return null;
      }
      
      // Prepare the request data
      const requestData = {
        name: groupData.name,
        description: groupData.description || ''
      };
      
      console.log(`Updating group ${sanitizedGroupId} with data:`, requestData);
      
      // Send the update request to the API
      const response = await api.put(`/group/${sanitizedGroupId}`, requestData);
      console.log(`Group ${sanitizedGroupId} updated:`, response.data);
      
      // Return the updated group
      return response.data;
    } catch (error) {
      console.error(`Error updating group ${groupId}:`, error);
      return null;
    }
  },
 
  // Delete a group
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      console.log(`Deleting group ${groupId}...`);
      
      // Validate the group ID
      if (!groupId || typeof groupId !== 'string') {
        console.error('Invalid group ID:', groupId);
        return false;
      }
      
      const sanitizedGroupId = groupId.trim();
      
      if (!sanitizedGroupId) {
        console.error('Empty group ID');
        return false;
      }
      
      // Send the delete request to the API
      const response = await api.delete(`/group/${sanitizedGroupId}`);
      console.log(`Group ${sanitizedGroupId} deleted:`, response.data);
      
      return true;
    } catch (error) {
      console.error(`Error deleting group ${groupId}:`, error);
      return false;
    }
  },

  /**
   * Get assignment statistics for a student in a course
   */
  async getStudentAssignmentStats(studentId: string, courseId: string): Promise<{
    studentId: string;
    courseId: string;
    totalAssignments: number;
    submittedAssignments: number;
    submissionRate: number;
  } | null> {
    try {
      const response = await api.get(`/student/${studentId}/assignments/stats?courseId=${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student assignment stats:', error);
      return null;
    }
  }
};

// Export specific methods for direct import
export const createGroup = groupService.createGroup;