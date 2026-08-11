import os
import re

def add_boilerplate(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # If already processed, skip
    if "public void set" in content or "public class " not in content:
        return

    # Remove lombok annotations
    content = re.sub(r'@Data\n?', '', content)
    content = re.sub(r'@Builder\n?', '', content)
    content = re.sub(r'@NoArgsConstructor\n?', '', content)
    content = re.sub(r'@AllArgsConstructor\n?', '', content)
    content = re.sub(r'@Getter\n?', '', content)
    content = re.sub(r'@Setter\n?', '', content)

    # Find class name
    class_match = re.search(r'public class (\w+)', content)
    if not class_match:
        return
    class_name = class_match.group(1)

    # Find fields
    fields = re.findall(r'private\s+([\w<>]+)\s+(\w+);', content)

    getters_setters = "\n"
    
    # Constructors
    getters_setters += f"    public {class_name}() {{}}\n"
    
    args = ", ".join([f"{t} {n}" for t, n in fields])
    assignments = "\n".join([f"        this.{n} = {n};" for t, n in fields])
    getters_setters += f"    public {class_name}({args}) {{\n{assignments}\n    }}\n"

    # Getters and Setters
    for t, n in fields:
        cap_n = n[0].upper() + n[1:]
        getters_setters += f"    public {t} get{cap_n}() {{ return {n}; }}\n"
        getters_setters += f"    public void set{cap_n}({t} {n}) {{ this.{n} = {n}; }}\n"
        
    # Builder
    builder_name = class_name + "Builder"
    getters_setters += f"\n    public static {builder_name} builder() {{ return new {builder_name}(); }}\n"
    
    getters_setters += f"    public static class {builder_name} {{\n"
    for t, n in fields:
        getters_setters += f"        private {t} {n};\n"
    for t, n in fields:
        getters_setters += f"        public {builder_name} {n}({t} {n}) {{ this.{n} = {n}; return this; }}\n"
        
    builder_args = ", ".join([f"this.{n}" for t, n in fields])
    getters_setters += f"        public {class_name} build() {{ return new {class_name}({builder_args}); }}\n"
    getters_setters += "    }\n"

    content = content.replace("}", getters_setters + "}\n")

    with open(file_path, 'w') as f:
        f.write(content)

dirs_to_process = [
    "src/main/java/com/medifind/appointment/dto",
    "src/main/java/com/medifind/appointment/entity",
    "src/main/java/com/medifind/appointment/exception"
]

for d in dirs_to_process:
    for f in os.listdir(d):
        if f.endswith(".java"):
            add_boilerplate(os.path.join(d, f))
