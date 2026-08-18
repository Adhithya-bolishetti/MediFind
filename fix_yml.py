import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Change port
    content = re.sub(r'port:\s*(\d{4})', r'port: ${PORT:\1}', content)
    
    # Change DB_PASSWORD
    content = re.sub(r'password:\s*"?\$\{\s*DB_PASSWORD\s*:\s*[^\}]+\s*\}"?', r'password: ${DB_PASSWORD}', content)
    
    # Change DB_USERNAME
    content = re.sub(r'username:\s*"?\$\{\s*DB_USERNAME\s*:\s*[^\}]+\s*\}"?', r'username: ${DB_USERNAME}', content)
    
    # Change JWT_SECRET
    content = re.sub(r'secret-key:\s*"?\$\{\s*JWT_SECRET\s*:\s*[^\}]+\s*\}"?', r'secret-key: ${JWT_SECRET}', content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('.'):
    if 'node_modules' in root or 'target' in root or '.git' in root:
        continue
    for file in files:
        if file in ['application.yml', 'application-prod.yml']:
            process_file(os.path.join(root, file))
