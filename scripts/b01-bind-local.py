"""Apply explicit loopback bindings to this disposable local stack only.

Docker Desktop 29.6.1 ignored the network's default host_binding_ipv4 option.
Recreate only B01 containers that publish ports, retaining their named volumes.
No environment values are printed or written to a file.
"""
import http.client
import json
import socket
import subprocess
from urllib.parse import quote


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


endpoint = docker("context", "inspect", "--format", "{{.Endpoints.docker.Host}}")
if not endpoint.startswith("unix://"):
    raise SystemExit("B01 requires a local Unix Docker socket")


class LocalDocker(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.connect(endpoint.removeprefix("unix://"))


def request(method, path, payload=None):
    connection = LocalDocker("localhost", timeout=60)
    body = json.dumps(payload).encode() if payload is not None else None
    connection.request(method, path, body, {"Content-Type": "application/json"})
    response = connection.getresponse()
    result = response.read()
    connection.close()
    if response.status >= 300:
        raise RuntimeError(f"Local Docker operation failed: {response.status}")
    return json.loads(result) if result else None


for service in ["db", "kong", "studio", "inbucket"]:
    name = f"supabase_{service}_bunchai-b01-local"
    info = json.loads(docker("inspect", name))[0]
    bindings = info["HostConfig"].get("PortBindings", {})
    if all(item.get("HostIp") == "127.0.0.1" for values in bindings.values() for item in values):
        continue
    for values in bindings.values():
        for item in values:
            item["HostIp"] = "127.0.0.1"
    networks = info["NetworkSettings"]["Networks"]
    if set(networks) != {"bunchai-b01-loopback"}:
        raise SystemExit(f"Unexpected network on {name}; no changes made to it")
    backup_name = name + "_before_loopback"
    docker("stop", name)
    docker("rename", name, backup_name)
    # The CLI copies generated API config/certificates into the writable layer.
    # Preserve that local-only layer as well as the named data volumes.
    snapshot = docker("commit", backup_name)
    payload = {
        **info["Config"],
        "Image": snapshot,
        "HostConfig": info["HostConfig"],
        "NetworkingConfig": {"EndpointsConfig": {
            "bunchai-b01-loopback": {"Aliases": networks["bunchai-b01-loopback"].get("Aliases", [])}
        }},
    }
    try:
        request("POST", "/containers/create?name=" + quote(name), payload)
        request("POST", "/containers/" + quote(name) + "/start")
    except Exception:
        print(f"Stopped backup retained as {backup_name}; do not start both copies")
        raise
    # Removing the stopped container preserves all named volumes (no -v).
    docker("rm", backup_name)
    print(f"Bound {name} to 127.0.0.1; named volumes preserved")
