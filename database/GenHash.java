import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Small helper to regenerate the BCrypt hash used in database/seed-admin.sql.
 *
 * Usage:
 *   javac -cp <spring-security-crypto.jar>;<spring-jcl.jar> GenHash.java
 *   java  -cp .;<spring-security-crypto.jar>;<spring-jcl.jar> GenHash <plaintext>
 *
 * Jars can be found in the local Maven repo, e.g.
 *   ~/.m2/repository/org/springframework/security/spring-security-crypto/6.2.3/
 *   ~/.m2/repository/org/springframework/spring-jcl/6.2.18/
 */
public class GenHash {
    public static void main(String[] args) {
        String plain = args.length > 0 ? args[0] : "Admin@232470";
        System.out.println("HASH=" + new BCryptPasswordEncoder().encode(plain));
    }
}
